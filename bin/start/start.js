import path from 'path';
import shell from 'shelljs';
import getPort from 'get-port';
import Gramps from '@gramps/gramps'; // eslint-disable-line
import express from 'express';
import bodyParser from 'body-parser';
import { EOL } from 'os';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';

export const builder = yargs => {
  yargs
    .positional('dir', {
      describe: 'path to data-source under development',
      type: 'string',
    })
    .group(['live', 'mock'], 'Choose real or mock data:')
    .options({
      live: {
        alias: 'l',
        conflicts: 'mock',
        description: 'run GraphQL with live data',
      },
      mock: {
        alias: 'm',
        conflicts: 'live',
        description: 'run GraphQL offline with mock data',
      },
    });
};

export const handler = async argv => {
  const mode = argv.live ? 'live' : 'mock';
  const enableMockData = argv.mock;
  const dataSources = [require(process.cwd(), argv.dir)]; // eslint-disable-line

  const app = express();
  const endpointURL = '/graphql';

  app.use(bodyParser.json());
  app.all(
    endpointURL,
    graphqlExpress(req => {
      const gramps = Gramps({ dataSources, enableMockData, req });
      return gramps;
    }),
  );
  app.get('/graphiql', graphiqlExpress({ endpointURL }));

  const PORT = await getPort(8080);
  app.listen(PORT, () => {
    const message = [
      `${EOL}============================================================`,
      `    GrAMPS is running in ${mode} mode on port ${PORT}`,
      '',
      `    GraphiQL: http://localhost:${PORT}/graphiql`,
      `============================================================${EOL}`,
    ];
    console.info(message.join(EOL)); // eslint-disable-line no-console
  });
};
