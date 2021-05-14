require('dotenv').config({ path: '.env' });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const finale = require('finale-rest');
const OktaJwtVerifier = require('@okta/jwt-verifier');

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: process.env.REACT_APP_OKTA_CLIENT_ID,
  issuer: `${process.env.REACT_APP_OKTA_ORG_URL}/oauth2/default`,
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(async (req, res, next) => {
  try {
    if (!req.headers.authorization) throw new Error('Authorization header is required');

    const accessToken = req.headers.authorization.trim().split(' ')[1];
    await oktaJwtVerifier.verifyAccessToken(accessToken, 'api://default');
    next();
  } catch (error) {
    next(error.message);
  }
});

const database = new Sequelize({
  dialect: 'sqlite',
  storage: './test.sqlite',
});

const Vehicle = database.define('vehicles', {
  year: Sequelize.STRING,
  make: Sequelize.TEXT,
  model: Sequelize.STRING,
});

finale.initialize({ app, sequelize: database });

finale.resource({
  model: Vehicle,
  endpoints: ['/vehicles', '/vehicles/:id'],
});

const port = process.env.SERVER_PORT || 3001;

database.sync().then(() => {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
});