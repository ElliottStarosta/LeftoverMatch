const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'leftovermatch-nextjs',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createLeftoverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLeftover', inputVars);
}
createLeftoverRef.operationName = 'CreateLeftover';
exports.createLeftoverRef = createLeftoverRef;

exports.createLeftover = function createLeftover(dcOrVars, vars) {
  return executeMutation(createLeftoverRef(dcOrVars, vars));
};

const getLeftoverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLeftover', inputVars);
}
getLeftoverRef.operationName = 'GetLeftover';
exports.getLeftoverRef = getLeftoverRef;

exports.getLeftover = function getLeftover(dcOrVars, vars) {
  return executeQuery(getLeftoverRef(dcOrVars, vars));
};

const listLeftoversRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLeftovers');
}
listLeftoversRef.operationName = 'ListLeftovers';
exports.listLeftoversRef = listLeftoversRef;

exports.listLeftovers = function listLeftovers(dc) {
  return executeQuery(listLeftoversRef(dc));
};

const createSharingInterestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSharingInterest', inputVars);
}
createSharingInterestRef.operationName = 'CreateSharingInterest';
exports.createSharingInterestRef = createSharingInterestRef;

exports.createSharingInterest = function createSharingInterest(dcOrVars, vars) {
  return executeMutation(createSharingInterestRef(dcOrVars, vars));
};
