import { CreateLeftoverData, CreateLeftoverVariables, GetLeftoverData, GetLeftoverVariables, ListLeftoversData, CreateSharingInterestData, CreateSharingInterestVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateLeftover(options?: useDataConnectMutationOptions<CreateLeftoverData, FirebaseError, CreateLeftoverVariables>): UseDataConnectMutationResult<CreateLeftoverData, CreateLeftoverVariables>;
export function useCreateLeftover(dc: DataConnect, options?: useDataConnectMutationOptions<CreateLeftoverData, FirebaseError, CreateLeftoverVariables>): UseDataConnectMutationResult<CreateLeftoverData, CreateLeftoverVariables>;

export function useGetLeftover(vars: GetLeftoverVariables, options?: useDataConnectQueryOptions<GetLeftoverData>): UseDataConnectQueryResult<GetLeftoverData, GetLeftoverVariables>;
export function useGetLeftover(dc: DataConnect, vars: GetLeftoverVariables, options?: useDataConnectQueryOptions<GetLeftoverData>): UseDataConnectQueryResult<GetLeftoverData, GetLeftoverVariables>;

export function useListLeftovers(options?: useDataConnectQueryOptions<ListLeftoversData>): UseDataConnectQueryResult<ListLeftoversData, undefined>;
export function useListLeftovers(dc: DataConnect, options?: useDataConnectQueryOptions<ListLeftoversData>): UseDataConnectQueryResult<ListLeftoversData, undefined>;

export function useCreateSharingInterest(options?: useDataConnectMutationOptions<CreateSharingInterestData, FirebaseError, CreateSharingInterestVariables>): UseDataConnectMutationResult<CreateSharingInterestData, CreateSharingInterestVariables>;
export function useCreateSharingInterest(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSharingInterestData, FirebaseError, CreateSharingInterestVariables>): UseDataConnectMutationResult<CreateSharingInterestData, CreateSharingInterestVariables>;
