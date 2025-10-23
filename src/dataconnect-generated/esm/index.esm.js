import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'leftovermatch-nextjs',
  location: 'us-east4'
};

export const createLeftoverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLeftover', inputVars);
}
createLeftoverRef.operationName = 'CreateLeftover';

export function createLeftover(dcOrVars, vars) {
  return executeMutation(createLeftoverRef(dcOrVars, vars));
}

export const getLeftoverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLeftover', inputVars);
}
getLeftoverRef.operationName = 'GetLeftover';

export function getLeftover(dcOrVars, vars) {
  return executeQuery(getLeftoverRef(dcOrVars, vars));
}

export const listLeftoversRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLeftovers');
}
listLeftoversRef.operationName = 'ListLeftovers';

export function listLeftovers(dc) {
  return executeQuery(listLeftoversRef(dc));
}

export const createSharingInterestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSharingInterest', inputVars);
}
createSharingInterestRef.operationName = 'CreateSharingInterest';

export function createSharingInterest(dcOrVars, vars) {
  return executeMutation(createSharingInterestRef(dcOrVars, vars));
}

