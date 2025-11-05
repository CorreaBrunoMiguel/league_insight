import { prisma } from '../db';
import { getTrainDatasetForSeason } from '../services/trainDatasetService';

async function main() {
  const dataset = await getTrainDatasetForSeason({
    leagueCode: 'BRA_SERIE_A',
    seasonYear: 2021,
    // roundStart: 1,
    // roundEnd: 1,
    // featureSchemaCode: 'v1_basica',
  });

  console.log(`Total de jogos no dataset: ${dataset.length}`);
  console.dir(dataset[0], { depth: null });
}

main()
  .catch((err) => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
