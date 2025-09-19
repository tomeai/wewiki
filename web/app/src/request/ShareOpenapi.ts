/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import httpRequest, { ContentType, RequestParams } from "./httpClient";
import {
  DomainPWResponse,
  GetShareV1OpenapiGithubCallbackParams,
  GithubComChaitinPandaWikiApiShareV1GitHubCallbackResp,
} from "./types";

/**
 * @description GitHub回调
 *
 * @tags ShareOpenapi
 * @name GetShareV1OpenapiGithubCallback
 * @summary GitHub回调
 * @request GET:/share/v1/openapi/github/callback
 * @response `200` `(DomainPWResponse & {
    data?: GithubComChaitinPandaWikiApiShareV1GitHubCallbackResp,

})` OK
 */

export const getShareV1OpenapiGithubCallback = (
  query: GetShareV1OpenapiGithubCallbackParams,
  params: RequestParams = {},
) =>
  httpRequest<
    DomainPWResponse & {
      data?: GithubComChaitinPandaWikiApiShareV1GitHubCallbackResp;
    }
  >({
    path: `/share/v1/openapi/github/callback`,
    method: "GET",
    query: query,
    type: ContentType.Json,
    format: "json",
    ...params,
  });
