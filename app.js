const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Server Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertObjectSnackToObjectCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDictObjectSnackToDictObjectCamelCase = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDistrictObject = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};
app.get(`/states/`, async (request, response) => {
  const getStateQuery = `SELECT * FROM state;`;
  const getStateArray = await db.all(getStateQuery);
  response.send(getStateArray.map(convertObjectSnackToObjectCamelCase));
});

app.get(`/states/:stateId/`, async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const getState = await db.get(getStateQuery);
  response.send(convertObjectSnackToObjectCamelCase(getState));
});

app.post(`/districts/`, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
                          VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const districtArray = await db.run(districtQuery);
  response.send("District Successfully Added");
});

app.get(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const getDistrict = await db.get(districtQuery);
  response.send(convertDictObjectSnackToDictObjectCamelCase(getDistrict));
});

app.delete(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const districtDeleteQuery = `DELETE FROM district WHERE district_id=${districtId}`;
  await db.run(districtDeleteQuery);
  response.send("District Removed");
});

app.put(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtUpdateQuery = `UPDATE district SET district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} WHERE district_id=${districtId};`;

  await db.run(districtUpdateQuery);
  response.send("District Details Updated");
});

app.get(`/states/:stateId/stats/`, async (request, response) => {
  const { stateId } = request.params;
  const getDistrictIdQuery = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths FROM district WHERE state_id=${stateId};`;
  const getStateObject = await db.get(getDistrictIdQuery);
  response.send(getStateObject);
});

app.get(`/districts/:districtId/details/`, async (request, response) => {
  const { districtId } = request.params;
  const districtIdQuery = `SELECT state_id FROM district WHERE district_id=${districtId};`;
  const getDistrictIdObject = await db.get(districtIdQuery);
  const { state_id } = getDistrictIdObject;
  const getStateQuery = `SELECT state_name AS stateName FROM state WHERE state_id=${state_id};`;
  const getStateObject = await db.get(getStateQuery);
  response.send(getStateObject);
});

module.exports = app;
