#!/usr/bin/env python3
"""Generate a PostgreSQL baseline migration from this project's Prisma schema.

This intentionally supports the Prisma features used by Ratneswar ERP only:
enums, scalar columns, defaults, PK/unique/index constraints and relations.
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "prisma" / "schema.prisma"
OUTPUT = ROOT / "prisma" / "migrations" / "20260726000000_init" / "migration.sql"

SCALARS = {"String", "Int", "Float", "Boolean", "DateTime", "Decimal", "Json", "BigInt", "Bytes"}


def short_name(value: str) -> str:
    if len(value) <= 60:
        return value
    digest = hashlib.sha1(value.encode()).hexdigest()[:8]
    return f"{value[:51]}_{digest}"


def quoted(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def strip_inline_comment(line: str) -> str:
    in_string = False
    escaped = False
    for i in range(len(line) - 1):
        ch = line[i]
        if escaped:
            escaped = False
            continue
        if ch == "\\":
            escaped = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string and line[i : i + 2] == "//":
            return line[:i]
    return line


@dataclass
class Field:
    name: str
    type_name: str
    optional: bool
    list_field: bool
    attrs: str


@dataclass
class Model:
    name: str
    table: str
    fields: list[Field] = field(default_factory=list)
    unique_sets: list[list[str]] = field(default_factory=list)
    indexes: list[list[str]] = field(default_factory=list)


def extract_blocks(text: str, keyword: str) -> list[tuple[str, str]]:
    pattern = re.compile(rf"^{keyword}\s+(\w+)\s*\{{\s*$", re.M)
    blocks: list[tuple[str, str]] = []
    for match in pattern.finditer(text):
        start = match.end()
        end = text.find("\n}", start)
        if end == -1:
            raise ValueError(f"Unclosed {keyword} {match.group(1)}")
        blocks.append((match.group(1), text[start:end]))
    return blocks


def parse_schema() -> tuple[dict[str, list[str]], dict[str, Model]]:
    text = SCHEMA.read_text()
    enums: dict[str, list[str]] = {}
    for name, body in extract_blocks(text, "enum"):
        values = []
        for raw in body.splitlines():
            line = strip_inline_comment(raw).strip()
            if line and not line.startswith("@@"):
                values.append(line.split()[0])
        enums[name] = values

    raw_models = extract_blocks(text, "model")
    model_names = {name for name, _ in raw_models}
    models: dict[str, Model] = {}

    for name, body in raw_models:
        table_match = re.search(r'@@map\("([^"]+)"\)', body)
        model = Model(name=name, table=table_match.group(1) if table_match else name)
        for raw in body.splitlines():
            line = strip_inline_comment(raw).strip()
            if not line:
                continue
            if line.startswith("@@unique"):
                match = re.search(r"@@unique\(\[([^\]]+)\]", line)
                if match:
                    model.unique_sets.append([x.strip() for x in match.group(1).split(",")])
                continue
            if line.startswith("@@index"):
                match = re.search(r"@@index\(\[([^\]]+)\]", line)
                if match:
                    model.indexes.append([x.strip() for x in match.group(1).split(",")])
                continue
            if line.startswith("@@"):
                continue
            match = re.match(r"(\w+)\s+([^\s]+)\s*(.*)$", line)
            if not match:
                continue
            field_name, raw_type, attrs = match.groups()
            list_field = raw_type.endswith("[]")
            optional = raw_type.endswith("?")
            type_name = raw_type.removesuffix("[]").removesuffix("?")
            model.fields.append(Field(field_name, type_name, optional, list_field, attrs))
        models[name] = model

    return enums, models


def sql_type(field: Field, enums: dict[str, list[str]]) -> str:
    attrs = field.attrs
    if field.type_name == "String":
        varchar = re.search(r"@db\.VarChar\((\d+)\)", attrs)
        return f"VARCHAR({varchar.group(1)})" if varchar else "TEXT"
    if field.type_name == "Int":
        return "INTEGER"
    if field.type_name == "BigInt":
        return "BIGINT"
    if field.type_name == "Float":
        return "DOUBLE PRECISION"
    if field.type_name == "Boolean":
        return "BOOLEAN"
    if field.type_name == "DateTime":
        return "TIMESTAMP(3)"
    if field.type_name == "Decimal":
        decimal = re.search(r"@db\.Decimal\((\d+)\s*,\s*(\d+)\)", attrs)
        return f"DECIMAL({decimal.group(1)},{decimal.group(2)})" if decimal else "DECIMAL(65,30)"
    if field.type_name == "Json":
        return "JSONB"
    if field.type_name == "Bytes":
        return "BYTEA"
    if field.type_name in enums:
        return quoted(field.type_name)
    raise ValueError(f"Unsupported scalar type {field.type_name} for {field.name}")


def default_sql(field: Field, enums: dict[str, list[str]]) -> str | None:
    if any(token in field.attrs for token in ("@default(cuid())", "@default(uuid())", "@default(autoincrement())")):
        return None
    if "@default(now())" in field.attrs:
        return "CURRENT_TIMESTAMP"
    match = re.search(r"@default\(([^()]*)\)", field.attrs)
    if not match:
        return None
    value = match.group(1).strip()
    if value.lower() in {"true", "false"}:
        return value.upper()
    if re.fullmatch(r"-?\d+(?:\.\d+)?", value):
        return value
    if value.startswith('"') and value.endswith('"'):
        inner = value[1:-1].replace("'", "''")
        return f"'{inner}'"
    if field.type_name in enums:
        return f"'{value}'::{quoted(field.type_name)}"
    raise ValueError(f"Unsupported default {value!r} on {field.name}")


def field_map(field: Field) -> str:
    match = re.search(r'@map\("([^"]+)"\)', field.attrs)
    return match.group(1) if match else field.name


def generate() -> str:
    enums, models = parse_schema()
    model_names = set(models)
    statements: list[str] = [
        "-- Ratneswar Engineering ERP baseline schema",
        "-- Generated from prisma/schema.prisma. Do not edit by hand; regenerate with scripts/generate_initial_migration.py.",
        "",
    ]

    for enum_name, values in enums.items():
        rendered = ", ".join("'" + value.replace("'", "''") + "'" for value in values)
        statements.append(f"CREATE TYPE {quoted(enum_name)} AS ENUM ({rendered});\n")

    relation_fks: list[str] = []
    for model in models.values():
        scalar_fields = [f for f in model.fields if not f.list_field and f.type_name not in model_names]
        column_lines: list[str] = []
        id_fields: list[str] = []
        unique_fields: list[str] = []

        for f in scalar_fields:
            col_name = field_map(f)
            parts = [quoted(col_name), sql_type(f, enums)]
            if not f.optional:
                parts.append("NOT NULL")
            default = default_sql(f, enums)
            if default is not None:
                parts.extend(["DEFAULT", default])
            column_lines.append("  " + " ".join(parts))
            if "@id" in f.attrs:
                id_fields.append(col_name)
            if "@unique" in f.attrs:
                unique_fields.append(col_name)

        if id_fields:
            constraint = short_name(f"{model.table}_pkey")
            column_lines.append(f"  CONSTRAINT {quoted(constraint)} PRIMARY KEY ({', '.join(quoted(x) for x in id_fields)})")
        for col in unique_fields:
            constraint = short_name(f"{model.table}_{col}_key")
            column_lines.append(f"  CONSTRAINT {quoted(constraint)} UNIQUE ({quoted(col)})")
        for cols in model.unique_sets:
            mapped = [field_map(next(f for f in scalar_fields if f.name == col)) for col in cols]
            constraint = short_name(f"{model.table}_{'_'.join(mapped)}_key")
            column_lines.append(f"  CONSTRAINT {quoted(constraint)} UNIQUE ({', '.join(quoted(x) for x in mapped)})")

        statements.append(f"CREATE TABLE {quoted(model.table)} (\n" + ",\n".join(column_lines) + "\n);\n")

        for cols in model.indexes:
            mapped = [field_map(next(f for f in scalar_fields if f.name == col)) for col in cols]
            index_name = short_name(f"{model.table}_{'_'.join(mapped)}_idx")
            statements.append(
                f"CREATE INDEX {quoted(index_name)} ON {quoted(model.table)} ({', '.join(quoted(x) for x in mapped)});"
            )
        if model.indexes:
            statements.append("")

        for rel_field in [f for f in model.fields if f.type_name in model_names and "@relation" in f.attrs]:
            fields_match = re.search(r"fields:\s*\[([^\]]+)\]", rel_field.attrs)
            refs_match = re.search(r"references:\s*\[([^\]]+)\]", rel_field.attrs)
            if not fields_match or not refs_match:
                continue
            local_names = [x.strip() for x in fields_match.group(1).split(",")]
            ref_names = [x.strip() for x in refs_match.group(1).split(",")]
            local_fields = [next(f for f in scalar_fields if f.name == name) for name in local_names]
            target_model = models[rel_field.type_name]
            target_scalar = [f for f in target_model.fields if not f.list_field and f.type_name not in model_names]
            local_cols = [field_map(f) for f in local_fields]
            ref_cols = [field_map(next(f for f in target_scalar if f.name == name)) for name in ref_names]
            delete_match = re.search(r"onDelete:\s*(\w+)", rel_field.attrs)
            if delete_match:
                on_delete = {
                    "Cascade": "CASCADE",
                    "SetNull": "SET NULL",
                    "Restrict": "RESTRICT",
                    "NoAction": "NO ACTION",
                }.get(delete_match.group(1), "RESTRICT")
            else:
                on_delete = "SET NULL" if any(f.optional for f in local_fields) else "RESTRICT"
            fk_name = short_name(f"{model.table}_{'_'.join(local_cols)}_fkey")
            relation_fks.append(
                f"ALTER TABLE {quoted(model.table)} ADD CONSTRAINT {quoted(fk_name)} "
                f"FOREIGN KEY ({', '.join(quoted(x) for x in local_cols)}) "
                f"REFERENCES {quoted(target_model.table)} ({', '.join(quoted(x) for x in ref_cols)}) "
                f"ON DELETE {on_delete} ON UPDATE CASCADE;"
            )

    statements.append("\n".join(relation_fks))
    statements.append("")
    return "\n".join(statements)


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(generate())
    print(f"Wrote {OUTPUT}")
