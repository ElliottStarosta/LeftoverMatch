import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateLeftoverData {
  leftover_insert: Leftover_Key;
}

export interface CreateLeftoverVariables {
  name: string;
  description: string;
  creationDate: DateString;
  expirationDate?: DateString | null;
  isShareable: boolean;
  status: string;
  photoUrl?: string | null;
}

export interface CreateSharingInterestData {
  sharingInterest_insert: SharingInterest_Key;
}

export interface CreateSharingInterestVariables {
  leftoverId: UUIDString;
  message?: string | null;
}

export interface GetLeftoverData {
  leftover?: {
    id: UUIDString;
    name: string;
    description?: string | null;
    creationDate: DateString;
    expirationDate?: DateString | null;
    isShareable?: boolean | null;
    status: string;
    photoUrl?: string | null;
  } & Leftover_Key;
}

export interface GetLeftoverVariables {
  id: UUIDString;
}

export interface Leftover_Key {
  id: UUIDString;
  __typename?: 'Leftover_Key';
}

export interface ListLeftoversData {
  leftovers: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    creationDate: DateString;
    expirationDate?: DateString | null;
    isShareable?: boolean | null;
    status: string;
    photoUrl?: string | null;
  } & Leftover_Key)[];
}

export interface Recipe_Key {
  id: UUIDString;
  __typename?: 'Recipe_Key';
}

export interface SharingInterest_Key {
  id: UUIDString;
  __typename?: 'SharingInterest_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateLeftoverRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLeftoverVariables): MutationRef<CreateLeftoverData, CreateLeftoverVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateLeftoverVariables): MutationRef<CreateLeftoverData, CreateLeftoverVariables>;
  operationName: string;
}
export const createLeftoverRef: CreateLeftoverRef;

export function createLeftover(vars: CreateLeftoverVariables): MutationPromise<CreateLeftoverData, CreateLeftoverVariables>;
export function createLeftover(dc: DataConnect, vars: CreateLeftoverVariables): MutationPromise<CreateLeftoverData, CreateLeftoverVariables>;

interface GetLeftoverRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLeftoverVariables): QueryRef<GetLeftoverData, GetLeftoverVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLeftoverVariables): QueryRef<GetLeftoverData, GetLeftoverVariables>;
  operationName: string;
}
export const getLeftoverRef: GetLeftoverRef;

export function getLeftover(vars: GetLeftoverVariables): QueryPromise<GetLeftoverData, GetLeftoverVariables>;
export function getLeftover(dc: DataConnect, vars: GetLeftoverVariables): QueryPromise<GetLeftoverData, GetLeftoverVariables>;

interface ListLeftoversRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListLeftoversData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListLeftoversData, undefined>;
  operationName: string;
}
export const listLeftoversRef: ListLeftoversRef;

export function listLeftovers(): QueryPromise<ListLeftoversData, undefined>;
export function listLeftovers(dc: DataConnect): QueryPromise<ListLeftoversData, undefined>;

interface CreateSharingInterestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSharingInterestVariables): MutationRef<CreateSharingInterestData, CreateSharingInterestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSharingInterestVariables): MutationRef<CreateSharingInterestData, CreateSharingInterestVariables>;
  operationName: string;
}
export const createSharingInterestRef: CreateSharingInterestRef;

export function createSharingInterest(vars: CreateSharingInterestVariables): MutationPromise<CreateSharingInterestData, CreateSharingInterestVariables>;
export function createSharingInterest(dc: DataConnect, vars: CreateSharingInterestVariables): MutationPromise<CreateSharingInterestData, CreateSharingInterestVariables>;

