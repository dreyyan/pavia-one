// [SERVICE] Resolve adviser's section'
async function resolveAdviserSection(adviserId) {
  const adviser = await prisma.adviser.findUnique({
    where: { adviserId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!adviser) {
    return { error: "Adviser not found", status: 404 };
  }

  const section = await prisma.section.findFirst({
    where: { adviserId: adviser.id },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      schoolYear: true,
      curriculum: true,
    },
  });

  if (!section) {
    return { error: "No advisory section assigned", status: 404 };
  }

  section.adviser = adviser;

  return { adviser, section };
}

module.exports = { resolveAdviserSection };
