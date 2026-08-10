"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Zap, Plus, ArrowRight, Trash2, Download, Bell, Check, Sparkles,
  TrendingUp, Wallet, FileSignature,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTableRows } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AreaChartCard, BarChartCard, DonutChart } from "@/components/ui/charts";
import {
  H1, H2, H3, H4, Lead, P, Muted, Eyebrow, Stat, InlineCode, Kbd, Blockquote,
} from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { staggerContainer, staggerItem, hoverLift } from "@/lib/motion";
import { cn } from "@/lib/utils";

const revenueData = [
  { month: "Jan", value: 42 }, { month: "Feb", value: 58 }, { month: "Mar", value: 51 },
  { month: "Apr", value: 74 }, { month: "May", value: 68 }, { month: "Jun", value: 91 },
];
const siteData = [
  { site: "PS-2", expense: 32 }, { site: "PS-3", expense: 48 }, { site: "SHPP-1", expense: 21 },
  { site: "Khavda", expense: 63 }, { site: "Gagodar", expense: 39 },
];
const tenderMix = [
  { name: "Won", count: 14 }, { name: "Submitted", count: 6 },
  { name: "Preparing", count: 3 }, { name: "Lost", count: 4 },
];

function Section({
  eyebrow, title, description, children,
}: { eyebrow: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Eyebrow className="text-brand-gold-light/80">{eyebrow}</Eyebrow>
        <H2>{title}</H2>
        {description && <Muted className="max-w-2xl">{description}</Muted>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("h-14 w-full rounded-xl border border-white/10 shadow-soft-sm", className)} />
      <Muted className="text-xs">{name}</Muted>
    </div>
  );
}

export default function DesignSystemPage() {
  const [progress, setProgress] = React.useState(58);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative min-h-dvh overflow-x-hidden">
        {/* ── Hero ── */}
        <header className="relative overflow-hidden border-b border-border px-6 py-20 md:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, hsl(var(--accent) / 0.12), transparent 45%), radial-gradient(circle at 80% 30%, hsl(var(--info) / 0.1), transparent 40%)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-gold-light to-brand-gold shadow-glow-gold">
              <Zap className="h-7 w-7 text-brand-navy" fill="currentColor" />
            </div>
            <Eyebrow className="text-brand-gold-light">Ratneswar Engineering · Design System</Eyebrow>
            <H1 className="text-gradient-white">
              Dark Luxury. <span className="text-gradient-gold">Glass. Precision.</span>
            </H1>
            <Lead className="max-w-xl">
              A reusable component system — glassmorphism surfaces, soft 3D depth, and
              restrained motion. Built to feel like Apple, Tesla, and Linear had a
              child, and gave it a gold signature.
            </Lead>
          </motion.div>
        </header>

        <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-20 md:px-12">
          {/* ── Typography ── */}
          <Section eyebrow="Foundation" title="Typography" description="Inter for UI, JetBrains Mono for tabular figures.">
            <Card variant="3d" className="p-8">
              <div className="flex flex-col gap-5">
                <H1>The quick brown fox jumps</H1>
                <H2>Section heading, tracking-tight</H2>
                <H3>Card / panel heading</H3>
                <H4>Label-weight heading</H4>
                <Lead>Lead paragraph — used for intros and empty-state copy.</Lead>
                <P>
                  Body text sits at 14px with relaxed leading for long-form reading —
                  tender notes, declarations, audit trails.
                </P>
                <Muted>Muted / secondary text for metadata and captions.</Muted>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Stat className="text-gradient-gold">₹42,68,900</Stat>
                  <Muted>tabular-nums, font-mono — for KPI figures</Muted>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <InlineCode>npm run dev</InlineCode>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                  <span className="text-xs text-muted-foreground">Command palette</span>
                </div>
                <Blockquote>&ldquo;Subject to Kutch Jurisdiction.&rdquo; — every invoice, always.</Blockquote>
              </div>
            </Card>
          </Section>

          {/* ── Color ── */}
          <Section eyebrow="Foundation" title="Palette" description="Semantic tokens — every component reads from these.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
              <Swatch name="Background" className="bg-background" />
              <Swatch name="Card" className="bg-card" />
              <Swatch name="Primary" className="bg-primary" />
              <Swatch name="Gold Accent" className="bg-gradient-to-br from-brand-gold-light to-brand-gold" />
              <Swatch name="Success" className="bg-success" />
              <Swatch name="Warning" className="bg-warning" />
              <Swatch name="Destructive" className="bg-destructive" />
              <Swatch name="Info" className="bg-info" />
              <Swatch name="Secondary" className="bg-secondary" />
              <Swatch name="Muted" className="bg-muted" />
              <Swatch name="Border" className="bg-border" />
              <div className="flex flex-col gap-2">
                <div className="glass h-14 w-full rounded-xl" />
                <Muted className="text-xs">Glass surface</Muted>
              </div>
            </div>
          </Section>

          {/* ── Buttons ── */}
          <Section eyebrow="Actions" title="Buttons" description="Every variant, every size, with press-scale micro-interaction.">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="gold"><Sparkles /> Gold</Button>
              <Button variant="glass">Glass</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive"><Trash2 /> Destructive</Button>
              <Button variant="success"><Check /> Success</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl" variant="gold">Extra Large</Button>
              <Button size="icon" variant="glass"><Bell /></Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Section>

          {/* ── Inputs ── */}
          <Section eyebrow="Forms" title="Inputs & Controls" description="Glass surfaces with a gold focus ring.">
            <Card variant="3d" className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ds-name">Tender name</Label>
                  <Input id="ds-name" placeholder="11KV Overhead Line — Lakhpat" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ds-value">Estimated value (invalid state)</Label>
                  <Input id="ds-value" invalid defaultValue="₹0" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select defaultValue="won">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tender status</SelectLabel>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ds-notes">Notes</Label>
                  <Textarea id="ds-notes" placeholder="EMD deadline, site conditions…" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Auto-generate invoice number</p>
                    <Muted>Sequential, editable anytime</Muted>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center gap-2.5">
                  <Checkbox id="ds-declare" defaultChecked />
                  <Label htmlFor="ds-declare" className="text-sm font-normal">
                    I declare all particulars are true and correct
                  </Label>
                </div>
              </div>
            </Card>
          </Section>

          {/* ── Badges & Status Chips ── */}
          <Section eyebrow="Feedback" title="Badges & Status Chips">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="gold">Gold</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusChip tone="success" pulse>Live</StatusChip>
              <StatusChip tone="warning">EMD Due in 3d</StatusChip>
              <StatusChip tone="destructive">Overdue</StatusChip>
              <StatusChip tone="info">Submitted</StatusChip>
              <StatusChip tone="gold" pulse>Won</StatusChip>
              <StatusChip tone="neutral">Draft</StatusChip>
            </div>
          </Section>

          {/* ── Cards ── */}
          <Section eyebrow="Surfaces" title="Cards" description="Default, glass, and soft-3D — all with an optional hover lift.">
            <motion.div
              variants={staggerContainer(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="grid gap-5 md:grid-cols-3"
            >
              {[
                { icon: TrendingUp, label: "Revenue (FY)", value: "₹1.48Cr", tone: "gold" as const, variant: "3d" as const },
                { icon: FileSignature, label: "Tenders Won", value: "14", tone: "success" as const, variant: "glass" as const },
                { icon: Wallet, label: "Pending EMD", value: "₹8.2L", tone: "warning" as const, variant: "default" as const },
              ].map((kpi) => (
                <motion.div key={kpi.label} variants={staggerItem}>
                  <Card variant={kpi.variant} hover="lift" className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/12 text-brand-gold-light">
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      <StatusChip tone={kpi.tone} pulse={kpi.tone === "gold"}>
                        {kpi.tone === "gold" ? "This month" : "Live"}
                      </StatusChip>
                    </div>
                    <Muted className="mt-4">{kpi.label}</Muted>
                    <Stat>{kpi.value}</Stat>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </Section>

          {/* ── Charts ── */}
          <Section eyebrow="Data" title="Charts" description="Recharts, themed with gradient fills and a glass tooltip.">
            <div className="grid gap-5 md:grid-cols-2">
              <Card variant="3d" className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Revenue trend</CardTitle>
                  <CardDescription>Last 6 months, ₹ lakh</CardDescription>
                </CardHeader>
                <AreaChartCard data={revenueData} xKey="month" yKey="value" />
              </Card>
              <Card variant="3d" className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Expense by site</CardTitle>
                  <CardDescription>₹ lakh, current quarter</CardDescription>
                </CardHeader>
                <BarChartCard data={siteData} xKey="site" yKey="expense" color="#5896FF" />
              </Card>
              <Card variant="3d" className="p-6 md:col-span-2">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Tender pipeline mix</CardTitle>
                  <CardDescription>By status, all-time</CardDescription>
                </CardHeader>
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <DonutChart data={tenderMix} nameKey="name" valueKey="count" className="sm:max-w-xs" />
                  <div className="grid grid-cols-2 gap-3">
                    {tenderMix.map((t, i) => (
                      <div key={t.name} className="flex items-center gap-2 text-sm">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: ["#C6A15B", "#5896FF", "#34D399", "#F87171"][i] }}
                        />
                        {t.name} <span className="text-muted-foreground">({t.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </Section>

          {/* ── Table ── */}
          <Section eyebrow="Data" title="Tables" description="Sticky header, hover rows, tabular numerals for figures.">
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender No.</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { no: "GMDC/TECH-1/LP/ELE/01", site: "Lakhpat Punrajpur", status: "success", label: "Won", value: "₹42,00,000" },
                    { no: "GETCO/O&M/PS-2/2026", site: "PS-2 Phase 2", status: "info", label: "Submitted", value: "₹18,50,000" },
                    { no: "SSNNL/SHPP-1/RPR/24", site: "SHPP-1", status: "warning", label: "Preparing", value: "₹9,80,000" },
                  ].map((row) => (
                    <TableRow key={row.no}>
                      <TableCell className="font-mono text-xs">{row.no}</TableCell>
                      <TableCell>{row.site}</TableCell>
                      <TableCell>
                        <StatusChip tone={row.status as any}>{row.label}</StatusChip>
                      </TableCell>
                      <TableCell className="tabular text-right font-mono">{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          {/* ── Dialogs ── */}
          <Section eyebrow="Overlays" title="Dialogs & Menus">
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild><Button variant="glass"><Plus /> New Tender</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Tender</DialogTitle>
                    <DialogDescription>Glass dialog panel — blurred backdrop, scale-in entrance.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-3">
                    <Input placeholder="Tender name" />
                    <Input placeholder="Tender No." />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button variant="gold">Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 /> Delete</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this tender?</AlertDialogTitle>
                    <AlertDialogDescription>This can&apos;t be undone. All linked documents stay untouched.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline">Actions <ArrowRight className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Tender actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><Download className="h-4 w-4" /> Export PDF</DropdownMenuItem>
                  <DropdownMenuItem><FileSignature className="h-4 w-4" /> Generate invoice</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild><Button size="icon" variant="ghost"><Bell /></Button></TooltipTrigger>
                <TooltipContent>3 EMDs due this week</TooltipContent>
              </Tooltip>

              <Avatar>
                <AvatarImage src="" alt="RE" />
                <AvatarFallback>RE</AvatarFallback>
              </Avatar>
            </div>
          </Section>

          {/* ── Tabs ── */}
          <Section eyebrow="Navigation" title="Tabs">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview"><P>Tender overview content renders here.</P></TabsContent>
              <TabsContent value="documents"><P>Linked documents list renders here.</P></TabsContent>
              <TabsContent value="activity"><P>Audit trail / activity feed renders here.</P></TabsContent>
            </Tabs>
          </Section>

          {/* ── Loading & Progress ── */}
          <Section eyebrow="Feedback" title="Loading & Progress">
            <div className="grid gap-6 md:grid-cols-2">
              <Card variant="3d" className="flex flex-col gap-4 p-6">
                <Muted>Skeleton — text</Muted>
                <SkeletonText lines={3} />
                <Separator />
                <Muted>Skeleton — avatar row</Muted>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3 rounded-full" />
                    <Skeleton className="h-2.5 w-1/2 rounded-full" />
                  </div>
                </div>
                <Muted>Skeleton — table rows</Muted>
                <div className="overflow-hidden rounded-lg border border-border">
                  <SkeletonTableRows rows={3} cols={4} />
                </div>
              </Card>
              <div className="flex flex-col gap-5">
                <SkeletonCard />
                <Card variant="3d" className="flex flex-col gap-3 p-6">
                  <div className="flex items-center justify-between">
                    <Muted>EMD submission progress</Muted>
                    <span className="tabular font-mono text-sm font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 10))}>-10</Button>
                    <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.min(100, p + 10))}>+10</Button>
                  </div>
                </Card>
              </div>
            </div>
          </Section>

          {/* ── Notifications ── */}
          <Section eyebrow="Feedback" title="Notifications" description="Toasts — glass surface, semantic accent border.">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => toast.success("Invoice generated", "RE/INV/26/014 saved to the register")}>Success toast</Button>
              <Button variant="outline" onClick={() => toast.error("Upload failed", "File exceeds 10MB limit")}>Error toast</Button>
              <Button variant="outline" onClick={() => toast.warning("EMD due soon", "Lakhpat tender — 3 days left")}>Warning toast</Button>
              <Button variant="outline" onClick={() => toast.info("Synced", "12 documents indexed")}>Info toast</Button>
            </div>
          </Section>

          {/* ── Motion ── */}
          <Section eyebrow="Motion" title="Hover & Press Effects" description="Spring-based lift on hover, scale on press — applied consistently across cards and buttons.">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {["Sites", "Tenders", "Documents", "Invoices"].map((label) => (
                <motion.div
                  key={label}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  variants={hoverLift}
                  className="card-3d hover-lift cursor-pointer p-5 text-center"
                >
                  <p className="text-sm font-medium">{label}</p>
                  <Muted className="mt-1 text-xs">hover me</Muted>
                </motion.div>
              ))}
            </div>
          </Section>

          <footer className="border-t border-border pt-8 text-center">
            <Muted>Ratneswar Engineering ERP — Design System v1.0</Muted>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
