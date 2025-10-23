# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetLeftover*](#getleftover)
  - [*ListLeftovers*](#listleftovers)
- [**Mutations**](#mutations)
  - [*CreateLeftover*](#createleftover)
  - [*CreateSharingInterest*](#createsharinginterest)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetLeftover
You can execute the `GetLeftover` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getLeftover(vars: GetLeftoverVariables): QueryPromise<GetLeftoverData, GetLeftoverVariables>;

interface GetLeftoverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLeftoverVariables): QueryRef<GetLeftoverData, GetLeftoverVariables>;
}
export const getLeftoverRef: GetLeftoverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLeftover(dc: DataConnect, vars: GetLeftoverVariables): QueryPromise<GetLeftoverData, GetLeftoverVariables>;

interface GetLeftoverRef {
  ...
  (dc: DataConnect, vars: GetLeftoverVariables): QueryRef<GetLeftoverData, GetLeftoverVariables>;
}
export const getLeftoverRef: GetLeftoverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLeftoverRef:
```typescript
const name = getLeftoverRef.operationName;
console.log(name);
```

### Variables
The `GetLeftover` query requires an argument of type `GetLeftoverVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetLeftoverVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetLeftover` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLeftoverData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetLeftover`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLeftover, GetLeftoverVariables } from '@dataconnect/generated';

// The `GetLeftover` query requires an argument of type `GetLeftoverVariables`:
const getLeftoverVars: GetLeftoverVariables = {
  id: ..., 
};

// Call the `getLeftover()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLeftover(getLeftoverVars);
// Variables can be defined inline as well.
const { data } = await getLeftover({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLeftover(dataConnect, getLeftoverVars);

console.log(data.leftover);

// Or, you can use the `Promise` API.
getLeftover(getLeftoverVars).then((response) => {
  const data = response.data;
  console.log(data.leftover);
});
```

### Using `GetLeftover`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLeftoverRef, GetLeftoverVariables } from '@dataconnect/generated';

// The `GetLeftover` query requires an argument of type `GetLeftoverVariables`:
const getLeftoverVars: GetLeftoverVariables = {
  id: ..., 
};

// Call the `getLeftoverRef()` function to get a reference to the query.
const ref = getLeftoverRef(getLeftoverVars);
// Variables can be defined inline as well.
const ref = getLeftoverRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLeftoverRef(dataConnect, getLeftoverVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.leftover);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.leftover);
});
```

## ListLeftovers
You can execute the `ListLeftovers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listLeftovers(): QueryPromise<ListLeftoversData, undefined>;

interface ListLeftoversRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListLeftoversData, undefined>;
}
export const listLeftoversRef: ListLeftoversRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listLeftovers(dc: DataConnect): QueryPromise<ListLeftoversData, undefined>;

interface ListLeftoversRef {
  ...
  (dc: DataConnect): QueryRef<ListLeftoversData, undefined>;
}
export const listLeftoversRef: ListLeftoversRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listLeftoversRef:
```typescript
const name = listLeftoversRef.operationName;
console.log(name);
```

### Variables
The `ListLeftovers` query has no variables.
### Return Type
Recall that executing the `ListLeftovers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListLeftoversData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListLeftovers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listLeftovers } from '@dataconnect/generated';


// Call the `listLeftovers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listLeftovers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listLeftovers(dataConnect);

console.log(data.leftovers);

// Or, you can use the `Promise` API.
listLeftovers().then((response) => {
  const data = response.data;
  console.log(data.leftovers);
});
```

### Using `ListLeftovers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listLeftoversRef } from '@dataconnect/generated';


// Call the `listLeftoversRef()` function to get a reference to the query.
const ref = listLeftoversRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listLeftoversRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.leftovers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.leftovers);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateLeftover
You can execute the `CreateLeftover` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createLeftover(vars: CreateLeftoverVariables): MutationPromise<CreateLeftoverData, CreateLeftoverVariables>;

interface CreateLeftoverRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLeftoverVariables): MutationRef<CreateLeftoverData, CreateLeftoverVariables>;
}
export const createLeftoverRef: CreateLeftoverRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createLeftover(dc: DataConnect, vars: CreateLeftoverVariables): MutationPromise<CreateLeftoverData, CreateLeftoverVariables>;

interface CreateLeftoverRef {
  ...
  (dc: DataConnect, vars: CreateLeftoverVariables): MutationRef<CreateLeftoverData, CreateLeftoverVariables>;
}
export const createLeftoverRef: CreateLeftoverRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createLeftoverRef:
```typescript
const name = createLeftoverRef.operationName;
console.log(name);
```

### Variables
The `CreateLeftover` mutation requires an argument of type `CreateLeftoverVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateLeftoverVariables {
  name: string;
  description: string;
  creationDate: DateString;
  expirationDate?: DateString | null;
  isShareable: boolean;
  status: string;
  photoUrl?: string | null;
}
```
### Return Type
Recall that executing the `CreateLeftover` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateLeftoverData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateLeftoverData {
  leftover_insert: Leftover_Key;
}
```
### Using `CreateLeftover`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createLeftover, CreateLeftoverVariables } from '@dataconnect/generated';

// The `CreateLeftover` mutation requires an argument of type `CreateLeftoverVariables`:
const createLeftoverVars: CreateLeftoverVariables = {
  name: ..., 
  description: ..., 
  creationDate: ..., 
  expirationDate: ..., // optional
  isShareable: ..., 
  status: ..., 
  photoUrl: ..., // optional
};

// Call the `createLeftover()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createLeftover(createLeftoverVars);
// Variables can be defined inline as well.
const { data } = await createLeftover({ name: ..., description: ..., creationDate: ..., expirationDate: ..., isShareable: ..., status: ..., photoUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createLeftover(dataConnect, createLeftoverVars);

console.log(data.leftover_insert);

// Or, you can use the `Promise` API.
createLeftover(createLeftoverVars).then((response) => {
  const data = response.data;
  console.log(data.leftover_insert);
});
```

### Using `CreateLeftover`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createLeftoverRef, CreateLeftoverVariables } from '@dataconnect/generated';

// The `CreateLeftover` mutation requires an argument of type `CreateLeftoverVariables`:
const createLeftoverVars: CreateLeftoverVariables = {
  name: ..., 
  description: ..., 
  creationDate: ..., 
  expirationDate: ..., // optional
  isShareable: ..., 
  status: ..., 
  photoUrl: ..., // optional
};

// Call the `createLeftoverRef()` function to get a reference to the mutation.
const ref = createLeftoverRef(createLeftoverVars);
// Variables can be defined inline as well.
const ref = createLeftoverRef({ name: ..., description: ..., creationDate: ..., expirationDate: ..., isShareable: ..., status: ..., photoUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createLeftoverRef(dataConnect, createLeftoverVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.leftover_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.leftover_insert);
});
```

## CreateSharingInterest
You can execute the `CreateSharingInterest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSharingInterest(vars: CreateSharingInterestVariables): MutationPromise<CreateSharingInterestData, CreateSharingInterestVariables>;

interface CreateSharingInterestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSharingInterestVariables): MutationRef<CreateSharingInterestData, CreateSharingInterestVariables>;
}
export const createSharingInterestRef: CreateSharingInterestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSharingInterest(dc: DataConnect, vars: CreateSharingInterestVariables): MutationPromise<CreateSharingInterestData, CreateSharingInterestVariables>;

interface CreateSharingInterestRef {
  ...
  (dc: DataConnect, vars: CreateSharingInterestVariables): MutationRef<CreateSharingInterestData, CreateSharingInterestVariables>;
}
export const createSharingInterestRef: CreateSharingInterestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSharingInterestRef:
```typescript
const name = createSharingInterestRef.operationName;
console.log(name);
```

### Variables
The `CreateSharingInterest` mutation requires an argument of type `CreateSharingInterestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSharingInterestVariables {
  leftoverId: UUIDString;
  message?: string | null;
}
```
### Return Type
Recall that executing the `CreateSharingInterest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSharingInterestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSharingInterestData {
  sharingInterest_insert: SharingInterest_Key;
}
```
### Using `CreateSharingInterest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSharingInterest, CreateSharingInterestVariables } from '@dataconnect/generated';

// The `CreateSharingInterest` mutation requires an argument of type `CreateSharingInterestVariables`:
const createSharingInterestVars: CreateSharingInterestVariables = {
  leftoverId: ..., 
  message: ..., // optional
};

// Call the `createSharingInterest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSharingInterest(createSharingInterestVars);
// Variables can be defined inline as well.
const { data } = await createSharingInterest({ leftoverId: ..., message: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSharingInterest(dataConnect, createSharingInterestVars);

console.log(data.sharingInterest_insert);

// Or, you can use the `Promise` API.
createSharingInterest(createSharingInterestVars).then((response) => {
  const data = response.data;
  console.log(data.sharingInterest_insert);
});
```

### Using `CreateSharingInterest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSharingInterestRef, CreateSharingInterestVariables } from '@dataconnect/generated';

// The `CreateSharingInterest` mutation requires an argument of type `CreateSharingInterestVariables`:
const createSharingInterestVars: CreateSharingInterestVariables = {
  leftoverId: ..., 
  message: ..., // optional
};

// Call the `createSharingInterestRef()` function to get a reference to the mutation.
const ref = createSharingInterestRef(createSharingInterestVars);
// Variables can be defined inline as well.
const ref = createSharingInterestRef({ leftoverId: ..., message: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSharingInterestRef(dataConnect, createSharingInterestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.sharingInterest_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.sharingInterest_insert);
});
```

