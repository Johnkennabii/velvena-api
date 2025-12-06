// drc/docs/swagger.ts
import userAuthPath from "./paths/auth/index.js";
import userAuthSchemas from "./components/schemas/auth/index.js";

import contractPaths from "./paths/contract/index.js";
import contractSchemas from "./components/schemas/contract/index.js";

import dressPath from "./paths/dress/index.js" ;
import dressSchemas from "./components/schemas/dress/index.js"; 

import dressColorsPath from "./paths/dress-colors/index.js" ;
import dressColorsSchemas from "./components/schemas/dress-colors/index.js"; 

import dressConditionsPath from "./paths/dress-conditions/index.js" ;
import dressConditionsSchemas from "./components/schemas/dress-conditions/index.js"; 

import dressSizesPath from "./paths/dress-size/index.js" ;
import dressSizesSchemas from "./components/schemas/dress-size/index.js"; 

import dressTypesPath from "./paths/dress-type/index.js" ;
import dressTypesSchemas from "./components/schemas/dress-type/index.js"; 

import contractTypesPath from "./paths/contract-type/index.js" ;
import contractTypesSchemas from "./components/schemas/contract-type/index.js"; 


import contractPackagesPath from "./paths/contract-package/index.js" ;
import contractPackagesSchemas from "./components/schemas/contract-package/index.js"; 


import contractAddonsPath from "./paths/contract-addon/index.js" ;
import contractAddonsSchemas from "./components/schemas/contract-addon/index.js"; 

import avatarStoragePath from "./paths/bucket/avatar/index.js" ;
import avatarStorageSchemas from "./components/schemas/bucket/avatar/index.js"; 

import dressStoragePath from "./paths/bucket/dress/index.js" ;
import dressStorageSchemas from "./components/schemas/bucket/dress/index.js"; 

import usersPath from "./paths/user/index.js" ;
import usersSchemas from "./components/schemas/user/index.js"; 

import profilesPath from "./paths/profile/index.js" ;
import profilesSchemas from "./components/schemas/profile/index.js"; 

import customersPath from "./paths/customer/index.js" ;
import customersSchemas from "./components/schemas/customer/index.js";

import { customerNotePaths } from "./paths/customer-note/index.js";
import { customerNoteSchemas } from "./components/schemas/customer-note/index.js";

import { prospectPaths } from "./paths/prospect/index.js";
import { prospectSchemas } from "./components/schemas/prospect/index.js";

import { prospectRequestPaths } from "./paths/prospect-request/index.js";
import { prospectRequestSchemas } from "./components/schemas/prospect-request/index.js";

import rolesPath from "./paths/roles/index.js" ;
import rolessSchemas from "./components/schemas/roles/index.js";

import mailPath from "./paths/mail/index.js" ;
import mailSchemas from "./components/schemas/mail/index.js";

console.log("✅ AUTH PATHS LOADED:", Object.keys(contractTypesPath));

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Allure Création API",
    version: "1.0.0",
    description: "API Documentation for Allure Création — modularized version",
  },
  servers: [
    { url: "https://api.allure-creation.fr", description: "Production Server" },
    { url: "http://localhost:4000", description: "Local Development Server" },
  ],
  tags: [
    { name: "Auth", description: "Authentication and user session endpoints" },
    { name: "Contracts", description: "Endpoints related to contract management" },
    { name: "Contract Types", description: "Endpoints related to contract type management" },
    { name: "Contract Packages", description: "Endpoints related to contract package management" },
    { name: "Contract Addons", description: "Endpoints related to contract addon management" },
    { name: "Dresses", description: "Endpoints related to dress management" },
    { name: "Avatars", description: "Endpoints related to avatar management" },
    { name: "Dress Storage", description: "Endpoints related to dress image management" },
    { name: "Dresses - Colors", description: "Endpoints related to dress color management" },
    { name: "Dresses - Conditions", description: "Endpoints related to dress contdition management" },
    { name: "Dresses - Sizes", description: "Endpoints related to dress size management" },
    { name: "Dresses - Types", description: "Endpoints related to dress type management" },
    { name: "Users", description: "Endpoints related to users management" },
    { name: "Profiles", description: "Endpoints related to profiles management" },
    { name: "Customers", description: "Endpoints related to customers management" },
    { name: "Customer Notes", description: "Endpoints related to customer notes management" },
    { name: "Prospects", description: "Endpoints related to prospects management and conversion" },
    { name: "Prospect Requests", description: "Endpoints related to prospect requests (demandes) with dress selections and estimates" },
    { name: "Roles", description: "Endpoints related to roles management" },
    { name: "Mail", description: "Endpoints related to email management (IMAP/SMTP)" },
  ],
  paths: {
    ...userAuthPath,
    ...contractPaths,
    ...contractTypesPath,
    ...contractPackagesPath,
    ...contractAddonsPath,
    ...dressPath,
    ...dressColorsPath,
    ...dressConditionsPath,
    ...dressSizesPath,
    ...dressTypesPath,
    ...avatarStoragePath,
    ...dressStoragePath,
    ...usersPath,
    ...profilesPath,
    ...customersPath,
    ...customerNotePaths,
    ...prospectPaths,
    ...prospectRequestPaths,
    ...rolesPath,
    ...mailPath,
  },
  components: {
    schemas: {
      ...userAuthSchemas,
      ...contractSchemas,
      ...contractTypesSchemas,
      ...contractPackagesSchemas,
      ...contractAddonsSchemas,
      ...dressSchemas,
      ...dressColorsSchemas,
      ...dressConditionsSchemas,
      ...dressSizesSchemas,
      ...dressTypesSchemas,
      ...avatarStorageSchemas,
      ...dressStorageSchemas,
      ...usersSchemas,
      ...profilesSchemas,
      ...customersSchemas,
      ...customerNoteSchemas,
      ...prospectSchemas,
      ...prospectRequestSchemas,
      ...rolessSchemas,
      ...mailSchemas,
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
};