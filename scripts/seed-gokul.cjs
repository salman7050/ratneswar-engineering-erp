const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const client = await prisma.client.upsert({
    where: { code: 'GOKUL' },
    update: {
      name: 'Gokul Agro Resources Ltd.',
      legalName: 'GOKUL AGRO RESOURCES LTD.',
      address: 'Nr. Sharma Resort, Galpadar-Anjar Road, Gandhidham, Gujarat',
      state: 'Gujarat',
      stateCode: '24',
      isActive: true,
    },
    create: {
      code: 'GOKUL',
      name: 'Gokul Agro Resources Ltd.',
      legalName: 'GOKUL AGRO RESOURCES LTD.',
      address: 'Nr. Sharma Resort, Galpadar-Anjar Road, Gandhidham, Gujarat',
      state: 'Gujarat',
      stateCode: '24',
      isActive: true,
    },
  });

  const site = await prisma.site.upsert({
    where: { siteCode: 'GOKUL-SOLAR-OM' },
    update: {
      name: 'Gokul Solar O&M – 2.9 MW',
      location: 'Gokul Agro Resources Ltd., Gandhidham Unit, Gujarat',
      type: 'SOLAR',
      client: 'Gokul Agro Resources Ltd.',
      capacity: '2900 kWp / 2.9 MW',
      status: 'ACTIVE',
      ownership: 'DIRECT',
      billingMode: 'MONTHLY',
      monthlyBillingEnabled: true,
      clientId: client.id,
    },
    create: {
      siteCode: 'GOKUL-SOLAR-OM',
      name: 'Gokul Solar O&M – 2.9 MW',
      location: 'Gokul Agro Resources Ltd., Gandhidham Unit, Gujarat',
      type: 'SOLAR',
      client: 'Gokul Agro Resources Ltd.',
      capacity: '2900 kWp / 2.9 MW',
      status: 'ACTIVE',
      ownership: 'DIRECT',
      billingMode: 'MONTHLY',
      monthlyBillingEnabled: true,
      clientId: client.id,
      notes: 'Monthly Operation & Maintenance of 2900 kWp Ground-Mounted Solar Power Plant.',
    },
  });

  const contract = await prisma.billingContract.upsert({
    where: { contractNo: 'RE/SOLAR-O&M/GOKUL/2026/001' },
    update: {
      title: 'Gokul 2.9 MW Solar — Monthly O&M',
      billToType: 'CLIENT',
      siteId: site.id,
      clientId: client.id,
      subcontractorId: null,
      gstType: 'SGST_CGST',
      active: true,
      destination: 'Gandhidham, Gujarat',
      notes: 'Ratneswar Engineering direct-client monthly billing profile.',
    },
    create: {
      contractNo: 'RE/SOLAR-O&M/GOKUL/2026/001',
      title: 'Gokul 2.9 MW Solar — Monthly O&M',
      billToType: 'CLIENT',
      siteId: site.id,
      clientId: client.id,
      gstType: 'SGST_CGST',
      active: true,
      destination: 'Gandhidham, Gujarat',
      notes: 'Ratneswar Engineering direct-client monthly billing profile.',
    },
  });

  const line = await prisma.billingLineTemplate.findFirst({ where: { billingContractId: contract.id, category: 'O_AND_M' } });
  const lineData = {
    sortOrder: 10,
    category: 'O_AND_M',
    description: 'Monthly Operation & Maintenance of 2900 kWp Ground Mounted Solar Power Plant',
    hsnCode: '998717',
    unit: 'Month',
    quantity: 1,
    rate: 107100,
    gstPercent: 18,
    active: true,
  };
  if (line) await prisma.billingLineTemplate.update({ where: { id: line.id }, data: lineData });
  else await prisma.billingLineTemplate.create({ data: { ...lineData, billingContractId: contract.id } });

  console.log('Gokul 2.9 MW O&M master ready:', site.name);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
