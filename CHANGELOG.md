# Changelog for matter.js

This page shows a detailed overview of the changes between versions without the need to look into code, especially to see relevant changes while interfaces and features are still in flux.

The main work (all changes without a GitHub username in brackets in the below list) is done by the core team of this project completely in their free time (see their individual profiles for sponsoring options): @Apollon77, @lauckhart, @turon and @mfucci

<!--
	Placeholder for the next version (at the beginning of the line):
	## __WORK IN PROGRESS__
-->

## __WORK IN PROGRESS__

-   @matter/create
    - Feature: Added command line option "--verbose" to enable informational NPM messages during initialization
    - Feature: Added template "contributor" to bootstrap dev environment for working on matter.js itself

-   @matter/node
    - Enhancement: The `with` functions on endpoint and cluster behavior types now alias to `withBehaviors` and `withFeatures` respectively to make their function more explicit
    - Enhancement: Endpoints now ignore persisted values for clusters when features change across restarts.  This allows for startup when persisted values become invalid due to conformance rules
    - Fix: Triggers CommissioningServer#initiateCommissioning when server restarts outside of factory reset
    - Fix: Ensures to initialize all known endpoint numbers to prevent dpuplicate number assignment edge cases

-   @matter/nodejs
    - Feature: New export @matter/nodejs/config allows for fine-grained configuration of Node.js bootstrap logic
    - Fix: Restores backward compatibility to sync storages from matter.js <0.11 in case ideas used special characters (uncommon)

-   @matter/protocol
    - Fix: Corrects the DataVersion Filter shortening logic to ensure maximum message size is not exceeded 

-   @matter/tools
    - Multi-project test runs now use a single process to improve performance

-   Matter cluster definitions and implementations
    - Enhancement: Removes default value from attribute ControlSequenceOfOperation of Thermostat cluster because feature specific enum value was used
    - Fix: Reverts MoveToLevel workaround from 0.11.4
    - Fix: ColorControl: Round calculated Kelvin values when calculated from Mireds
    - Fix: GeneralDiagnostics: Network interface names are now correctly shortened to 32 characters

-   matter.js git repository
    - Feature: We've added project configuration for VS code including recommended extensions, code snippets and launch configurations

## 0.11.4 (2024-11-07)

-   Matter cluster definitions and implementations
    - Fix: Adjusted levelControl cluster command MoveToLevel implementation to temporarily declare optionsMask/optionsOverride fields optional

### 0.11.3 (2024-11-06)

-   @matter/nodejs
    - Fix: The MaybeAsyncStorage class close method is not async
    - Fix: Makes sure that the Async storage waits that all writes are finished in some cases

-   @matter/nodejs-ble
    - Fix: When BLE scanning was not started we also do not need to stop it (and risk blocking issues)

-   @project-chip/matter-node.js
    - Fix invalid import for compat package

## 0.11.2 (2024-11-02)

-   @matter/node
    - Feature: Automatically lock behavior state on invoke
    - Fix: Ensures to fully load the Descriptor cluster before adding additional device types 

-   @project-chip/matter.js
    - Fix: Fixes some compatibility re-exports that got screwed up since 0.11.0

## 0.11.1 (2024-10-31)

-   @matter/create
    - Fix: Project generator includes all required dependencies for controller and complex devices
    - Feature: Project generator now includes .gitignore and VS Code launch configuration

## 0.11.0 (2024-10-29)

-   IMPORTANT: As of 0.10.0 the @project-chip/matter.js module has grown quite large.  This release includes major refactoring that moves functional areas into independent NPM packages under the "@matter" org.  We have added exports to maintain backwards compatibility but these are not exhaustive.  In some cases you may need to update imports to reference new code locations.

-   Cross-module changes
    -   Info: Matter.js now uses aliases via `package.json` "imports" field.  This is an internal change that simplifies imports but should not affect consumers
    -   Info: Previously we used a mix of snake-case and CamelCase for sub-package exports.  We have now standardized on snake case.  Compatibility packages (see below) continue to support the original module names

-   @matter/general:
    -   Info: General functionality that is not Matter specific previously resided in `@project-chip/matter.js`.  It now lives in `@matter/general`
    -   BREAKING: The "ByteArray" type is removed, replaced with native-JS Uint8Array and a small collection of utility functions in the "Bytes" namespace
    -   Feature: The default "Time" implementation is now fully functional across all standard JS runtimes
    -   Enhancement: Network transports can now self select which the protocols and addresses they support
    -   Feature: A new `ObserverGroup` class simplifies binding management for multiple observables
    -   Feature: Introduced a new Async Disk key/Value-Storage compatible with the sync one driven by node-localstorage and uses it by default in new API and controller instances

-   @matter/main:
    -   Info: This package is a new "one-and-done" dependency for applications.  It automatically loads platform specialization and reexports packages above as appropriate

-   @matter/model:
    -   Info: The Matter object model previously exported as `@project-chip/matter.js/model` now resides in `@matter/model`
    -   Info: Individual elements exported by name are now models (fully functional classes) rather than elements (raw JSON data).  This should be backwards compatible but makes them more useful operationally

-   @matter/node:
    -   Info: The high-level APIs previously defined in `@project-chip/matter.js` now reside in `@matter/node`.  The Node API includes node management, behavior definitions and endpoint definitions
    -   Info: We export behaviors under `@matter/node/behaviors` or individually (e.g. `@matter/node/behaviors/on-off`)
    -   Info: We export device type definitions for system endpoints and devices under `@matter/node/endpoints` and `@matter/node/devices` respectively.  You may also import these via index or individually

-   @matter/nodejs:
    -   Info: Node.js specialization is moved here.  `@project-chip/matter-node.js` remains as a compatibility import.
    -   BREAKING: The previously deprecated re-exports in matter-node.js from matter.js are removed.

-   @matter/nodejs-ble
    -   Info: The BLE specialization for Node.js is moved here.  `@project-chip/matter-node-ble.js` remains as a compatibility import.
    -   Info: The noble and bleno dependencies got updated to also support Ubuntu 24

-   @matter/nodejs-shell:
    -   Breaking: The Shell Storage was moved to the new approach.  Please use "--legacyStorage" on startup to connect with the old storage to get into your old shell history and commissioned devices.  Storage migration guide see in the [README.md](./packages/nodejs-shell/README.md#matterjs-v011-storage-adjustment).
    -   Feature: Added new shell command "tlv" with TLV decoding and structure logging tooling  
    -   Enhancement: Added option to specify if attributes are loaded from remote or locally
    -   Enhancement: The shell now saves a 100 history of commands and restores this on startup
    -   Enhancement: Add a "nodes status" command to show the status of all nodes

-   @matter/protocol:
    -   Info: Low-level Matter logic previously defined in `@project-chip/matter.js` now resides in `@matter/protocol`.  This includes network communication, fabric management and cluster invocation, read/write, events, etc.
    -   BREAKING: Various types that were previously specialized with template parameters are no longer generic.  This should be largely transparent to API consumers.  Compatibility exports still support the generic parameters in some, but not all, cases.
    -   BREAKING: We have done some reorganization of lower-level implementation classes to improve implementation flexibility.  You probably do not use these classes directly so will be unaffected.
    -   Feature: New functional components including `DeviceCommissioner`, `DeviceAdvertiser`, `NodeFinder` and `Subscription` now perform functions that previously were in the (deprecated) MatterDevice class
    -   Enhancement: To simplify low-level configuration, many components in the protocol module now optionally retrieve dependencies from an Environment
    -   Enhancement: Limits the number of parallel exchanges to 5
    -   Enhancement: Uses the session timing details to calculate the timeout for subscription messages when received as client additionally to the subscription maxInterval
    -   Enhancement: Internal restructuring of Controller logic and setup. Introducing "peers" (commissioned node on a shared fabric)
    -   Fix: When subscribing with keepSubscriptions === false the existing subscriptions need to be removed earlier in the flow
    -   Fix: Clear resumption records also when fabric gets updated or deleted

-   @matter/types:
    -   Info: Various definitions previously defined in `@project-chip/matter.js` now reside in `@matter/types`.  This includes most TLV structures, cluster definitions, and various support types
    -   Info: Clusters are not exported in `@project-chip/matter.js`.  You can import via `@project-chip/types/clusters` or individually (e.g. `@project-chip/types/clusters/window-covering`)

-   @matter/examples:
    -   Enhancement: Adds a new example to show a PlugIn-Socket with Energy and Power measurement 

-   @matter/cli-tool:
    -   Feature: This new package offers a specialized JS environment for interacting with Matter and matter.js
    -   The "matter" command supports standard JS syntax and a "shell" style syntax that emulates common shell commands
    -   The virtual filesystem exposed by the tool allows you to navigate matter.js's packages and active subsystems
    -   This is an alpha feature.  We'll add command line control and additional functionality over time

-   @matter/create
    -   Feature: This new package bootstraps matter.js-based projects.
    -   For usage run `npm init @matter help` anywhere you have Node.js installed

-   Matter-Core functionality:
    -   Enhancement: Allow to discover VendorId + ProductId together optionally

-   matter.js clusters:
    -   Adds convenience helper method for ElectricalEnergyMeasurement cluster (usage see new example MeasuredSocketDevice) to set measurements and also trigger the needed events when imported and exported values changed in the measurement and events are required by specification
    
-   matter.js Controller API:
    -   Breaking: PairedNode instances are now created and directly returned also when the node is not et connected. This do not block code flows anymore for offline devices
    -   Breaking: Because of this  "getConnectedNode()" got renamed to "getPairedNode()"
    -   Breaking: "nodeState" property on PairedNode got renamed to "state"
    -   Breaking: Removed SupportedEventClient and UnknownSupportedEventClient and replaced by EventClient because EventList is provisional and was removed now (was not working for many devices anyway)
    -   Breaking: Removed ClusterClient methods isEventSupported and isEventSupportedByName because event lists are no longer available
    -   Deprecation: The attributeChangedCallback, eventTriggeredCallback and nodeStateChangedCallbacks are deprecated and replaced by new events "attributeChanged", "eventTriggered" and "stateChanged", "structureChanged" and "decommissioned" on PairedNode
    -   Feature: Some more data (like Network interfaces, PowerSources, Thread details) are collected and used when connecting to the nodes
    -   Feature: Based on device type the minimum and maximum subscription interval is now automatically set based on certain best practices. When multiple nodes are subscribed all Thread based devices are initialized by a "4 in parallel queue" to limit the used thread bandwidth.
    -   Feature: Subscribed attribute data are cached for each node and used on reconnects by utilizing dataVersionFilters on read and subscribes to reduce bandwidth on reconnects. The data are no (yet) persisted, so after Controller restart the data are collected anew.
    -   Feature: Low level InteractionClient API allows to enrich the attribute data that are not returned because of dataVersionFilters.
    -   Feature: Properly announces the controller node on start for devices to find the controller if needed and to utilize persisted subscriptions on device side 
    -   Enhancement: Only recreate PairedNode internal objects when structure really changed also on reconnects.
    -   Enhancement: Utilize more information (beside partList changes now also feature, serverList, attributeList, generatedCommandLists) as structure change to reinitialize objects.
    -   Enhancement: Huge refactoring in internal logic, optimized reconnection and rediscovery

## 0.10.7 (2024-11-07)

-   Matter cluster definitions and implementations
    - Fix: (Backport from 0.11.4) Adjusted levelControl cluster command MoveToLevel implementation to temporarily declare optionsMask/optionsOverride fields optional

## 0.10.6 (2024-09-21)

-   Matter-Core functionality:
    -   Fix: Excludes subscription based attribute change reads from acl check in all cases

## 0.10.5 (2024-09-20)

-   Matter-Core functionality:
    -   Enhancement: Added some more logging for sessions and ACL failures

## 0.10.4 (2024-09-16)

-   matter.js API:
    -   Fix: Prevent trying to access PowerTopology attribute which is not always present
    -   Fix: Always add the endpoint device types first to the device type list

## 0.10.3 (2024-09-15)

-   Matter-Core functionality:
    -   Fix: Fixes channel cleanup
    -   Fix: Fixes Subscription error handling

## 0.10.1 (2024-09-08)

-   Matter-Core functionality:
    -   Enhancement: Added an "expected processing time" for interactions to be executed by the peer
    -   Enhancement: Added additional wait time after last resubmission was done to allow a full resubmission cycle from the peer
    -   Enhancement: Optimized PASE/CASE message timing comparable to chip sdk (expects e.g. 30s processing time for crypto related calls)
    -   Fix: Optimized exchange handling for cases where retransmissions were all sent but no ack was received
    -   Fix: Makes sure that Retransmissions happen in all error cases
-   matter.js New API:
    -   Fix: Optimized some special cases in the ColorControl cluster default implementation
-   matter.js Controller API:
    -   Breaking: Adjusted some method signatures slightly (e.g. connect()) to summarize singe parameters into an options object
    -   Enhancement: Restructured Paired Node connection handling to make sure NodeStatus is correct and commands return in case of error. Reconnections are handled in the background.
    -   Enhancement: Takes over new connection options when a node is connected again after disconnect with different options

## 0.10.0 (2024-08-31)

-   IMPORTANT: This release upgrades Matter support from Matter 1.1 to the latest release, Matter 1.3.0.1. This includes BREAKING CHANGES in a number of areas due to specification changes and some improvements in how we define datatypes. For the most part these changes are transparent because they involve low-level APIs, implicit type names, or Matter features that were never adopted elsewhere. However, some small code changes may be necessary depending on how you use Matter.js.

-   Matter.js Parser and Code generator:
    -   Feature: We now generate all Matter datatypes and elements. This includes some we defined by hand previously and those introduced by the Matter 1.2 and Matter 1.3 specifications.
    -   Feature: We now generate some datatypes that are not officially global or part of a specific cluster but are nevertheless defined in Matter specifications.
    -   Enhancement: Expanded dialect for conformance, constraint and "other quality" DSLs.
    -   Enhancement: Includes numerous code generation improvements.
-   Matter.js Matter Definition, Clusters, Schemas and Device-Types (independent of the used API)
    -   Breaking: Cluster revisions have increased and there are new mandatory elements for a few clusters. We have implemented these in places where we provide non-skeletal cluster implementations.
    -   Breaking: Previously we generated redundant definitions for struct, enum and bitmap types in *Interface.ts and *Cluster.ts files. We've eliminated those in the interface files.
    -   Breaking: Previously we generated redundant TLV and types for datatypes used by multiple clusters. We now only provide these types in their canonical location (globally or in the `ClusterName` namespace for the base cluster).
    -   Breaking: Some datatype names have changed to align with changes in the Matter specification and to make names more logical.
    -   Breaking: We've removed a few deprecated definitions for unused Matter elements such as the Scenes cluster.
    -   Breaking: Globals.ts previously defined core datatypes for the Matter object model. These are now generated and individually importable.
    -   Breaking: We've removed a few old draft datatypes defined in [connectedhomeip](https://github.com/project-chip/connectedhomeip) that were abandoned, renamed or are still "draft" as of Matter 1.3.
    -   Breaking: Some types related to ClusterServer are simplified.  This should be largely transparent but the template arguments are slightly different
    -   Feature: Adds all elements (clusters, attributes, events, commands, device types and datatypes) introduced in Matter 1.2 and Matter 1.3.
    -   Feature: Adds all Standard Namespaces defined by Matter 1.3 
-   Matter-Core functionality:
    -   Breaking: Removes the discovery capability "softAccessPoint" as it was removed from the Matter specification
    -   Breaking: Matter.js now requires node.js 18+
    -   Breaking: We now target ES 2022 for transpiled output.  We have not adopted new language features but this does mean that we generate true class properties now
    -   Breaking: We've removed the APIs `tryCatch` and `tryCatchAsync`.  These were used internally -- not part of any Matter related API -- but were exported
    -   Feature: Increase Data Model revision to 17 (introduced by Matter 1.2)
    -   Feature: Added Base64 encoding/decoding support to ByteArray
    -   Feature: Added WildcardPathFlagsBitmap to Attribute expansion for read/subscribe Interactions
    -   Feature: Added Matter 1.3 session params
    -   Feature: Added support for Multi-Invokes for Matter 1.3 (default for now are 10 invokes till we have a better value)
    -   Enhancement: Update Session parameters in PASE/CASE to match Matter 1.3 specification
    -   Enhancement: Removes TCP and ICD TXT records from MDNS responses because both currently not supported and optional to reduce the size of the MDNS responses
    -   Enhancement: Adds encoding and decoding of custom TlvData in QR-Codes including extensible Schema support for the defined Matter fields
    -   Enhancement: Optimizes Read and Subscribe handling for clients/controller to better match with specification
    -   Enhancement: Adds encoding/decoding support for multiple device information in one QR-Code
    -   Enhancement: Makes processing of manual Pairing codes more robust directly on decoding level
    -   Enhancement: Refactored Message size handling to dynamically calculate payload size based on transport capabilities
    -   Enhancement: Refactored and cleanup CASE and PASE and corrected handling in some places
    -   Enhancement: Added BTP Idle timeout as defined in Matter specification
    -   Enhancement: Enhanced default implementation of GeneralDiagnostics cluster with new convenience methods
    -   Enhancement: Many more protocol and functionality syncs with matter specification 1.3
    -   Enhancement: The Network methods that handles NetworkInterfaces are now "MaybePromise" to allow async implementations
    -   Enhancement/Fix: Several fixes and optimizations in Session and Message Exchange handling
    -   Enhancement/Fix: Adjusted MRP behavior with chip and only use/expect MRP ion unreliable channels (UDP). Fixes BLE commissioning
    -   Fix: Adjusted ValidationErrors to be more specific if they should return "InvalidAction" ot "ConstraintError".
    -   Fix: Adjusted some returned errors to be more specific and to the specification (e.g. InvalidAction instead of Failure)
    -   Fix: Fixed StandaloneAck handling to use an outstanding ack number as piggybacked ack number
    -   Fix: Makes sure subscription maxInterval cannot exceed the matter defined maximum of 60mins
    -   Fix: Synced attMtu handling with chip to always use MTU-3 bytes for BLE connections
-   matter.js API:
    -   Breaking: Node.start() is now asynchronous and returns when the node is online. This is only breaking in that lack of await will result in an unhandled rejection. Node.bringOnline() is deprecated.
    -   Feature: Adds default implementations for i18n clusters including Localization, Time Format Localization and Unit Localization.
    -   Feature: Adds interactionBegin and interactionEnd events for ClusterBehaviors to demarcate online interactions that mutate state.
    -   Feature: Any state value defined with schema is now configurable via the environment.
    -   Feature: You may now mark endpoints as "non-essential" to prevent errors from incapacitating a node.
    -   Feature: Utility device types are added automatically to the endpoints when the relevant clusters (like PowerSource or ElectricalSensor) are existing on the endpoint
    -   Feature: Adds DescriptorServer#addTag to make adding tags more convenient
    -   Feature: Modifies DescriptorServer#addDeviceType to accept device type name to simplify avoidance of cyclical dependencies
    -   Enhancement: Various Endpoint methods throw the root cause when there is an error rather than logging the root cause and throwing a less descriptive error.
    -   Enhancement: Explicitly defines DescriptorServer as an endpoint requirement so attributes are configurable in TS directly
-   matter.js Controller API:
    -   Breaking: commissionNode() in CommissioningController now returns the Node-ID and not the PairedNode instance.
    -   Breaking: AttributeClient now throws an exception when an attribute should be subscribed which is not reporting updates via subscriptions
    -   Feature: Adds PaseCommissioner to allow to execute the initial (PASE based) commissioning process separately from the operational completion of the commissioning process, also allowed to be BLE only.
    -   Feature: Allows to complete the commissioning process for a node where this process was started by a PASE commissioner
    -   Feature: Allows to commission a node without directly connecting to it
    -   Enhancement: Always read attributes that do not report changes via subscriptions (including all unknown Attributes)
    -   Fix: Skips network commissioning during commissioning when the commissioning is already using an IP based channel (like UDP)
    -   Fix: Fixes Node reconnection when disconnected before
    -   Fix: Makes sure to always use the BLE scanner when required
    -   Fix: Prevents reading subscribed attributes from remote if not requested and needed
    -   Fix: (digitaldan) Makes sure to re-use the same callbacks and options for a re-subscription of a Paired Node
-   matter.js Legacy API:
    -   Deprecation: We've deprecated the hand-generated device type definitions used by the pre-0.8.0 API in DeviceTypes.ts. These device type definitions remain at Matter 1.1.
    -   Removal: We removed old Scenes cluster implementation which was never fully implemented or used by any Matter controller
-   matter.js-react-native:
    -   Feature: Introduces new package to provides a React Native compatible platform Implementations for Matter.js. This package is still in development and not fully working and should be considered experimental for now! Currently it tries to support UDP, BLE, AsyncStorage and Crypto platform features. See [README](./packages/matter.js-react-native/README.md) for more information.
-   matter.js chip and python Testing:
    -   Includes updates and infrastructure improvements for Matter.js use of tests defined in [connectedhomeip](https://github.com/project-chip/connectedhomeip)

### 0.9.4 (2024-07-19)

-   Matter-Core functionality:
    -   Feature: Allows to generate Certification declarations flagged as provisional for certification purposes
    -   Feature: Allows to disable mandatory field checks on TLV encoding when handling fabric sensitive structs
    -   Fix: Makes sure to remove fabric sensitive fields and events when they are not allowed to be read or subscribed
    -   Fix: Makes sure to handle commissioning related cases with PASE sessions correctly regarding temporarily added fabrics and certificates
    -   Fix: Verifies provided trusted root certificates completely

### 0.9.3 (2024-06-26)

-   Matter-Core functionality:
    -   Fix: Makes sure to clear all subscriptions from the subscriber noe and not only the current session when not keeping subscriptions

### 0.9.2 (2026-06-20)

-   Matter-Core functionality:
    -   Enhancement: Added some more certification relevant checks in Interaction server

### 0.9.1 (2024-06-01)

-   IMPORTANT: This version adds Access Control functionality and also tries to set missing ACL entries on startup on a best effort basis. If you encounter issues and have Access/Permission denied errors ain the logs then please delete and recommission the device to make sure all ACLs are set correctly. If this is not possible open GitHub issue or contact us in Discord to get help.
-   Matter-Core functionality:
    -   Feature: Implemented Access Control List (ACL) as required by Matter specification
    -   Enhancement: Enhanced several internal structures needed to support ACL properly
    -   Enhancement: Enhanced all datatypes that are MEIs to allow validation of the MEI and the allowed scopes and value ranges
    -   Enhancement: Remembers CATs from Sessions and uses them for CASE session resumptions
    -   Enhancement: Allows decoding of TlvLists with protocol specific tags
    -   Enhancement: Refactored channel management to match specification and allow several channels per fabric and node
    -   Enhancement: Closing message exchanges already when last message got acknowledged and prevent up to 9s waiting time for closures
    -   Enhancement: Prevents to announce a new commissionable device just before doing a factory reset
    -   Enhancement: Expires announcements for last removed fabric directly
    -   Fix: Fixes deepCopy to really doing a deep copy and not just copying the first level
-   matter.js Legacy API:
    -   Feature: Added Access Control cluster implementation
    -   Feature: Added minimal Group key management cluster implementation which supports no additional groups (so only IPK allowed)
    -   Enhancement: Enhanced Operational Credentials cluster to add needed ACLs on commissioning including backward compatibility
-   matter.js New API:
    -   Feature: Added Access Control cluster implementation
    -   Feature: Added minimal Group key management cluster implementation which supports no additional groups (so only IPK allowed)
    -   Enhancement: Enhanced Operational Credentials cluster to add needed ACLs on commissioning including backward
    -   Enhancement: Optimized Factory reset logic when last Fabric is removed
    -   Fix: Persist also writable and fabric scoped data in new API
    -   Fix: Releases locks also in Precommit errors
-   Chip testing:
    -   Added automatic testing of chip tests suites for ACE, ACL and partly IDM

### 0.9.0 (2024-05-14)

-   Matter-Core functionality:
    -   Feature: cluster default implementations for the following clusters were added/updated:
        -   BooleanState: Automatically emit the StateChange event when enabled for the cluster and the stateValue changes
        -   ColorControl: Implemented all features and commands as defined by specification with an optional transition logic managed by matter.js
        -   LevelControl: Implemented all non-Frequency command handlers as defined by specification with an optional transition logic managed by matter.js
        -   LocalizationConfiguration: Implemented activeLocale validation
        -   LowPower: Implemented event `enterLowPowerMode` to be emitted when the sleep command gets called
        -   ModeSelect: Implemented all features and commands as defined by specification
        -   Switch: Implement all features and events including debouncing (optional), switch-release, long- and multi-press detections
        -   TimeFormatLocalization: Implemented activeTimeFormat validation
        -   WindowCovering: Implemented all features and commands as defined by specification
    -   Enhancement: Adjusted handling of TlvList order to match better with matter specification and ensure field orders are preserved
    -   Enhancement: Adds Certificate validation and cryptographic verification during commissioning and CASE session establishment
    -   Enhancement: Adds additional logging information for PASE and CASE to better understand errors without debug logging
    -   Enhancement: Adds several Optimizations and adjustments for Obervers (e.g. Observable.isObserved)
    -   Fix: Corrects returned errors for two commands on OperationalCredentials cluster
-   matter.js Legacy API:
    -   Breaking: The object type for providing custom production certificates has changed to be now in sync with the DeviceCertification class (just the property names changed)
    -   Feature: Added on demand certification determination via an async certificate provider method (alternative to provideing certs directly) to determine certificates on first commissioning request
-   matter.js New API:
    -   Breaking: The name of the _$Change Events for attributes and such are changed to _$Changed . Please adjust your code!
    -   Breaking: Introduced ExtensionInterface to define extensible/custom methods for behavior/Cluster-Server implementation to be available when extending this class (needed because of a TS bug 27965)
    -   Feature: Added on demand certification determination via an async certificate provider method (alternative to provideing certs directly) to determine certificates on first commissioning request
    -   Enhancement: Optimized constraint validations and conformance error messages
    -   Enhancement: Conditionally enables the ReachableChanged event on the Root Endpoint BasicInformation cluster if the reachable attribute is defined in the defaults
    -   Enhancement: Allow to register events directly when initializing endpoints like in legacy API
    -   Enhancement: Allows for cluster implementations to dynamically add/enable state attributes and events
    -   Enhancement: Added "fieldName$Changing" event handlers that emit in transaction pre-commit and allow for state mutation and will cycle for a limited number of times until state is stable
    -   Enhancement: Allows "fieldName$Changed" and "fieldName$Changing" event handlers to be async
    -   Enhancement: Adds Conformance validation for enums, fieldname references and some more cases
    -   Enhancement: Makes various config variables apply dynamically
    -   Enhancement: Added environment variable `network.interfaceNameTypeMap' to allow mapping of network interface names to types (Wifi, Thread, Ethernet)
    -   Fix: Fixes some issues around event handling in the new API and makes sure events are not de-registered on factory resets
    -   Fix: Corrects the returned status error code when an Enum value is set to an invalid value
    -   Fix: Fixes a floating promise in FailsafeTimer; it tended to kill a test run without an easy way to identify the cause
    -   Fix: Fixes bounds check with references to null fields
    -   Fix: Addresses rejections that were erroniously being treated as uncaught when multiple reactions were queued
-   Chip testing:
    -   Enhancement: Adds automatic CI testing for all clusters listed in [matter.js Readme](./packages/matter.js/README.md)
-   matter.js tooling:
    -   Enhancement: Migrates cluster identification to the pattern used in the newer device code. It now scans the entire document rather than attempting to navigate via the index. This is simpler and more resilient
    -   Enhancement: Various other small changes improve resiliency
    -   Enhancement: Removes the "main" closure from codegen scripts that added a bit of friction to debugging
    -   Enhancement: Adds proper CLI support to codegen scripts to override various behaviors and provide information on the script
    -   Enhancement: We now version the intermediate models. In the future we can use this to add informational revision information to model elements and make the API adaptive based on the targeted Matter version
    -   Fix: Fixes a bug that was causing field-level prose to be incorrectly associated with the containing element in malformed portions of the core spec

### 0.8.1 (2024-04-15)

-   Matter-Core functionality:
    -   Cluster default implementations for the following clusters were added/updated:
        -   (GreydonDesu) Feature: DoorLock: Implemented bare minimal commands to lock/unlock the door
        -   Enhancement: Enhanced Identify cluster default implementation by additional state `isIdentifying` and events `startIdentifying` and `stopIdentifying`
    -   Enhancement: Diagnostic and logging information, also on SIGUSR2 signal for node.js
    -   Fix: Updates subscribed events on structure updates to make sure also new events are reported correctly
    -   Fix: Removed invalid length assumption in Sigma2
-   matter.js New API code flows:
    -   Enhancement: Optimizes Node activity tracking and shutdown/startup handling

## 0.8.0 (2024-03-29)

-   Packages
    -   IMPORTANT: We switch away from re-exporting all matter.js functionality in matter-node.js, so please adjust your imports and make sure that you include matter.js together with matter-node.js in your dependencies in the exact same version!
    -   Changed BLE library (Bleno/Noble) to another fork with better support for Windows and UART devices
-   Matter-Core functionality:
    -   Breaking: Storage implementations got added new methods "contexts", "values" and a multi-set valiant that need to be implemented if you have own Storage implementations. Also, storages now derive from a SyncStorage or MaybeAsyncStorage class weather they are sync or async
    -   Adjustment: Cluster versions do not need to be persisted, so remove in legacy and new API
    -   Fix: Decode Empty nullable data types as null when they have constrains that would require a minimum length
    -   Fix: Convert Error type of Network errors and handle in case of subscription failures
    -   Fix: Fixes a cryptographic issue that failed PASE establishment in 1/255 times, Replace BN/elliptic by @noble/curves library
    -   Fix: Fixed ClusterClient methods set and subscribe to really return the Promise of the action
-   matter.js API:
    -   IMPORTANT: Introduction of new High level API with complete Device type support for Matter 1.1 types, see [migration guide](./docs/MIGRATION_GUIDE_08.md). For now the known API that we had up top 0.7 is still included and fully working and compatible when old imports are used, but called "Legacy" for now. It will be removed in a later version not yet decided.
    -   Feature: Introduced Environment concept to centralize MDNS, storage and configuration and platform specific central functionalities (Replaces MatterServer from Legacy API).
    -   Feature: Enhanced Matter protocol and interaction abstractions and introduced transactional handling of actions which are rolled back completely in case onf errors.
-   matter-node.js
    -   Enhancement: Makes sure console.log on node.js correctly log Proxy objects with their data and not the Proxy object itself
    -   Enhancement: Allows to send SIGHUP2 signal to the node.js process to print out information on running timers and promises of the process to console
-   matter-node.js Examples
    -   IMPORTANT: All existing example scripts got renamed to \*Legacy.ts when the use the "old/until now"-API and can be used directly after changing the name (exception: DeviceNode.ts became DeviceNodeFullLegacy.ts!). They are 100% compatible to the ones before.
    -   Feature: Added all examples again converted to use the new devices API and we also added some more new device types to show the new API better
    -   Feature: Enhanced DeviceNodeFull example to show several more way on how to use the new API and special cases.
    -   Feature: Enhanced DeviceNodeFull example to simulate a Thread Networking device to check BLE commissioning flows
-   matter.js Tooling
    -   Enhanced Code generation to also generate classes for Cluster implementations and device types with full Feature configurability and TypeScript typing support for this

## 0.7.5 (2024-02-23)

-   Matter-Core functionality:
    -   Feature: Allowed multiple Loggers and log targets to be registered. Logging to console is still default
    -   Enhancement: Implemented handling for session interval parameters as defined by Matter 1.2 specification
    -   Enhancement: Improved discovery data handling and use MDNS data for Pase/Case connections session interval parameters
    -   Enhancement: Storing session parameter with session resumption details to reuse on session restores
    -   Enhancement: Enhanced encoding of fabricIndex field in write interactions and optimized validation for such cases
    -   Enhancement: Prevented resending the same MDNS scanner queries
    -   Enhancement: Optimized MDNS Scanner queries to prevent resending of queries that are already in progress
    -   Enhancement: Optimized Commissioning error handling for Controller
    -   Enhancement: Enhanced ValidationError to provide the affected structure-aware fieldname in case of an error
    -   Fix: Improved Standalone Ack handling for messages to match Matter 1.2 specification
    -   Fix: Adjusted commands GoToLiftPercentage and GoToTiltPercentage to match with Matter SDK and work around specification issue
    -   Fix: Fixed BLE commissioning for Controller
    -   Fix: Makes sure to validate the data when invoking a command from a cluster client
    -   Fix: Only set session active timestamp if we create a session based on an incoming message and not when we are the creator of the session to prevent too fast resubmissions
    -   Fix: Correctly handle CASE Resumptions without known resumption records and fallback to a full CASE session establishment
    -   Fix: Enhanced commissioning flow based on latest Matter SDK test cases and match with specification
    -   Fix: Enhanced handling for fabric scoped command invokes to match with specification
    -   Fix: Enhanced handling for fabric sensitive attribute reads to match with specification
-   matter.js API:
    -   Fix (potentially Breaking): Remove NetworkCommissioningCluster (Ethernet) from default added clusters in CommissioningServer because we formally have an out-of-band network connection, re-add manually if needed!
    -   Enhancement: Allowed to pass connect options when connecting a node for Controller
    -   Enhancement: Stored Discovery and Basic information data for commissioned nodes and allow API access for easy determination of devices without need to connect to them
    -   Enhancement: Improved OnOff/Dimmable Lighting devices and add Startup handling to match specification
    -   Enhancement: Remove Scenes cluster for now from all device types because provisional and changes upcoming with Matter 1.3
    -   Enhancement: Optimized Commissioning error handling
    -   Enhancement: Added connection options to Controller connect methods
    -   Enhancement: Enhanced CLI arguments parser to allow "--name" additionally to "-name"
    -   Fix: Adjusted the Group limits in GroupKeyManagement cluster to 1 because we do not support groups yet
    -   Fix: (Luligu) Corrected the Device type for bridged nodes with Power source information
    -   Fix: Adjusted Commissioning logic for Controller to accept devices without network commissioning cluster by assuming out-of-band IP connection
-   matter.js shell:
    -   Feature: Added support for Debug logging into a Logfile additionally to e.g. Info logging in console
    -   Enhancement: Adjusted logic to output detailed node information on nodes command
    -   Enhancement: Do not subscribe all attributes when connecting a node for administrative actions (unpair, open commissioning windows)
    -   Enhancement: Allowed to specify the BLE HCI id as shell start parameter and store in settings
    -   Enhancement: Added attribute, event and command actions in the shell based on the Cluster model (all known Matter 1.1 clusters are supported)
    -   Enhancement: Enhanced the Shell Readme with many information and examples
    -   Fix: Correctly quote when showing configuration values for wifi- and thread-credentials
    -   Fix: Fixed issues when using quoted strings as CLI parameters (e.g. for wifi/thread credentials or JSON structs for commands/attribute writes)

## 0.7.4 (2023-12-31)

-   Matter-Core functionality:
    -   Enhancement: Refactor Core Session management to match specification
    -   Enhancement: Refactor message duplication detection and handling to match specification
    -   Feature: Upgrade Interaction protocol revision to 11 (Matter 1.2) and adjust event error handling in DataReports

## 0.7.3 (2023-12-18)

-   Matter-Core functionality:
    -   Feature: Added CASE Authenticated Tags support (initialization from NOC and validation only)
    -   Enhancement: Added validation handling to Invoke processing
    -   Fix: Fixed message size check to allow processing of two big non matter UDP messages
-   matter.js API:
    -   Feature: Added NodeStateInfo state "Decommissioned" to inform from about a successful decommissioning of a device
    -   Feature: Added check that provided unique storageKeys are really unique
    -   Fix: Makes sure to initialize all nodes in the MatterServer on startup also if errors occur on single ones
    -   Fix: Only try to connect to a commissioned device in controller if it has at least one
    -   Fix: Makes sure to call commissioningChanged callback when device is factory reset
    -   Fix: Really remove all data in factory reset of a device

## 0.7.2 (2023-12-04)

-   Matter-Core functionality:
    -   Corrected default values for TemperatureMeasurement Cluster
    -   Handled Message extensions and Secured extensions in matter messages correctly (means they are ignored for now but read from the data stream)
    -   Handles too huge UDP messages correctly by dropping such messages

## 0.7.1 (2023-11-24)

-   Matter-Core functionality:
    -   Optimized Exchange deletion and change a throw to log when a already deleted Exchange should be deleted again
-   matter.js API:
    -   Added some convenient methods on PairedNode instance to access Clusters on Devices and also the RootEndpoint (if needed)
    -   Added method to cancel a running discovery process for commissionable devices

## 0.7.0 (2023-11-13)

-   General
    -   Breaking: Changed ES target from ES5 to ES2018 (affected environments probably already didn't support matter.js)
    -   Feature (vilic): Added project references and additional tsconfigs to support standard tsc development workflows
    -   Enhance: Optimizing build speed
    -   Enhance: matter-node-ble.js is published as CJS/ESM hybrid package
    -   Enhance: matter-node.js-examples is published as ESM module
-   Matter-Core functionality:
    -   Breaking: QrCodes are not longer pre-rendered, but can be generated by QrCode.get() (from schema export),see examples
    -   Fix: Handles event data correctly on subscription initially and also on updates to trigger the listeners
    -   Fix (vilic): Adjust network interface handling for Windows to use the zone id instead of network interface name
    -   Enhance (vilic): Added MDNS Memberships to sockets for better operation on Windows and other platforms
    -   Enhance: Refactor session management and make sure also controller handle session close requests from devices
    -   Enhance: Refactor close handing for exchanges and channels to make sure they are closed correctly
    -   Feature: Added detection of missing Subscription updates from a device and allow to react to such a timeout with callback
    -   Feature: Added generation method for random passcodes to PaseClient
    -   Feature: Generalized Discovery logic and allow discoveries via different methods (BLE+IP) in parallel
    -   Feature: Added functionality to clear session contexts including data in sub-contexts or not
    -   Feature: Enhance discovery methods to allow continuous discovery for operational devices
-   matter.js API:
    -   Breaking: Rename resetStorage() on CommissioningServer to factoryReset() and add logic to restart the device if currently running
    -   Breaking: Restructure the CommissioningController to allow pairing with multiple nodes
        -   Adjusts some property and structure namings to be more consistent
        -   Introducing class PairedNode with the High level API for a paired Node
        -   Restructured CommissioningController to handle multiple nodes and offer new high level API
        -   Changed name of the unique storage id for servers or controllers added to MatterServer to "uniqueStorageKey"
        -   Adjusted subscription callbacks to also provide the nodeId of the affected device reporting the changes to allow callbacks to be used generically when connecting to all nodes
        -   Introduces a node state information callback to inform about the connection status but also when the node structure changed (for bridges) or such.
    -   Breaking: Deprecated the option "mdnsAnnounceInterface" and replaced by "mdnsInterface" and now used to limit announcements and scanning to a specific interface
    -   Breaking: Makes sure that also nodes added to a MatterServer after it was started are also started to behave the same. "add" methods are now async.
    -   Feature: Enhanced CommissioningServer API and CommissioningController for improved practical usage
    -   Feature: Makes Port for CommissioningServer optional and add automatic port handling in MatterServer
    -   Feature: Allows removal of Controller or Server instances from Matter server, optionally with deleting the storage
    -   Enhance: Makes passcode and discriminator for CommissioningServer optional and randomly generate them if not provided
-   matter-node-shell.js
    -   Feature: Completely refactored and enhances shell to support commissioning, identify and many more new commands. See Readme, try it
-   matter-node.js-examples
    -   Breaking: Rename parameter -announceinterface to -netinterface and use for announcements and scanning

## 0.6.0 (2023-10-08)

-   Matter-Core functionality:
    -   Fix: Adjusted Event Priority definition to match to specs
    -   Fix: Adjusted Bleno and Noble to be optional Dependencies to allow building the Monorepo also when these are failing (e.g. on Windows)
    -   Fix: Added missing MDNS announcement expiry and allowed to announce fabrics and an open commissioning window in parallel
    -   Fix: Prevented crash when logging undefined/null values
    -   Feature: Implemented TimedInteractions for Write/Invoke request s as required by specs
    -   Feature: Added support for generic Response suppression if requested or needed for group communication
    -   Feature (orlenkoo) Implemented first OnOff Cluster Lighting feature command handlers (WIP)
    -   Feature: Also publishes matter-node.js packages as ESM in parallel to CJS
    -   Feature: Added clear method to the storage classes to allow factory reset of the storage
    -   Feature: Added ICAC (Intermediate CA Certificate) decoding
    -   Feature: Implemented Array chunking for DataReport messages to allow also bigger array structures to be sent
    -   Feature: Implemented Tag compression for DataReport messages (but disabled it because standard do not support it officially yet)
    -   Feature: Refactor complete commissioning logic (AdministratorCommissioning, GeneralCommissioning, OperationalCredentials clusters) to match to specs and implement main logics as defined
    -   Enhance: Memory footprint optimizations
    -   Enhance: Introduced building and building, running and test executions scripts to not use ts-node anymore and many more optimizations to test and build processes
    -   Enhance: ClusterFactory internally uses a simplified method of CLuster types that are compatible to the current ones but soon might replace them
    -   Enhance: Using longer response timeouts when Failsafe timer is active during commissioning (Controller)
    -   Enhance: Optimized Commissioning logic of Controller implementation regarding failsafe timers and network commissioning
    -   Enhance: Added timeout handing to the Message queue to prevent reading DataReports get stuck if device do not send anymore
    -   Enhance: Added support in StatusResponseError to also handle a cluster specific status code (for write and invoke)
    -   Enhance: Added init and destroy methods to the Cluster-handlers to allow to build proper cluster logics and also to free resources (e.g. stop timers on cluster destroy)
    -   Enhance: Re-Announce the device when a subscription was cancelled by a peer in order to have a fast reconnect of the peer
    -   Enhance: Adjusted MDNS implementation to be more near to MDNS specifications and also added performance optimizations
-   matter-node.js:
    -   Fix: (vilic) Enhancements for windows networking and tooling
-   matter.js API:
    -   Breaking: Move "disableIpv4" from CommissioningController/Server options to MatterServer to also consider it for MDNS scanning and broadcasting
    -   Breaking: Change MatterServer constructor second parameter to be an options object
    -   Breaking: Streamline Device API and rename onOff/isOnOff -> get/setOnOff
    -   Breaking: EndpointStructureLogger (method logEndpointStructure) was moved from util to device export!

## 0.5.0 (2023-08-22)

-   Matter-Core functionality:
    -   Breaking: Added support to allow to clearly model some more attribute types with internally different behaviour:
        -   Added types for WritableFabricScopedAttribute and OptionalWritableFabricScopedAttribute
        -   Added types for FixedAttribute and OptionalFixedAttribute
        -   Added FixedAttributeServer which only allows to "get" the value but not to set it
        -   Added FabricScopedAttributeServer which gets and sets the value based on the provided fabric
        -   Updated ClusterServerObj and ClusterClientObj typings to respect these Attribute types
        -   Updated all Cluster definitions that use such attribute types
    -   Breaking: Add Interface for Events which requires to define the supported events when creating a ClusterServer
    -   Breaking: Include Event support in InteractionClient which changes several Read/Subscribe method signatures or adds new methods
    -   Breaking: GeneralCommissioningServerHandler is now a function that takes configuration for setRegulatoryConfig handling
    -   Breaking: Types of specific clusters are no longer exported flat on main level. Cluster exports are now namespaces that include their types.
    -   Breaking: All collection files meant to be used for exports only are renamed to export.ts and should not be used for internal imports
    -   Breaking: Attribute listener methods renamed: addListener -> addValueSetListener, addMatterListener -> addValueChangeListener (also remove methods) to make it more clear what they do
    -   Breaking: Change from object style to Branded types for special Datatype objects (e.g. "new VendorId(0xFFF1)" -> "VendorId(0xFFF1)")
    -   Breaking: ClusterClient and ClusterServer classes were moved from "interaction" export to "cluster" export
    -   Breaking: Refactor the (low level) ClusterClient API to be more convenient to use with many optional fields for read/write/subscribe
    -   Breaking: Cluster\*Obj and the internal representation for more correct typings
    -   Breaking: The InteractionClient is no longer exchangeable in ClusterClient cases (because makes no sense and was never working)
    -   Feature: Enhance CommissioningServer options to also specify GeneralCommissioningServer details and settings
    -   Feature: Adjust RegulatoryConfig Handling in Device and Controller to match with specifications
    -   Feature: Endpoint Structures use custom-unique-id (from EndpointOptions)/uniqueStorageKey (from BasicInformationCluster)/serialNumber (from BasicInformationCluster)/ Index (in this order) to store and restore the endpoint ID in structures
    -   Feature: (@mahimamandhanaa) Add BTP (Bluetooth Transport Protocol) codec class for encoding and decoding of BTP messages
    -   Feature: Enhanced BitMap typing and Schemas to allow "Partially" provided Bitmaps by suppressing the "unset" bits
    -   Feature: Allow to define discoveryCapabilities structure when getting pairing code in CommissioningServer
    -   Feature: Added Bluetooth package (matter-node-ble.js) to allow to use Bluetooth as transport layer for initial commissioning. Implemented device side for now
    -   Feature: Global Attributes are also accessible in ClusterClient instances (e.g. to get the list of features of the cluster)
    -   Feature: Refactor Controller Commissioning process and add network commissioning support
    -   Feature: Correctly Handle FabricIndex fields for Read and Write requests
    -   Feature: Handle subscription errors and destroy session if failing more than 3 times
    -   Feature: Add full event support (Device and Controller) including triggering some default events automatically (startup, shutdown, reachabilityChanged, bootReason)
    -   Feature: Added support for dataVersionFiltering and eventFilters for read and subscribe requests for Device and Controllers
    -   Feature: Added more parameters to several InteractionClient methods to allow to configure more parameters of the requests
    -   Feature: Allows subscripts to be updated dynamically when the endpoint structure for bridges changes by adding or removing a device
    -   Feature: When used as Controller also "unknown" CLusters, Attributes, Events and DeviceTypes are generically parsed and supported and can be detected as unknown in code
    -   Feature: When used as controller the read data about supported attributes, events are considered when create Attribute/EventClient objects and can be differentiated by PresentAttributeClient/UnknownPresentAttributeClient class types
    -   Enhance: Device port in MDNSBroadcaster is now dynamically set and add UDC (User directed Commissioning) Announcements
    -   Enhance: Enhanced MessageCodec and check some more fields
    -   Enhance: Added possibility to define conditional cluster attribute/Command/event definitions and introduce runtime checking for these. Part of Cluster Structure rework still WIP
    -   Enhance: (@vves) Add Window Covering Cluster definition
    -   Enhance: Split up and corrected PowerSource and PressureMeasurement Cluster based on Matter 1.1 Specs
    -   Enhance: Detailed cluster data model and related logic
    -   Enhance: Generates all cluster definitions from Matter 1.1 specification and CHIP v1.1-branch automatically. This brings basic definition support for all clusters!
    -   Enhance: Makes sure Fabric-Scoped requests are handled correctly for read and subscriptions
    -   Enhance: All Errors thrown by the library are now derived from the MatterError class and split up into several subclasses
    -   Fix: Added missing PulseWidthModulationLevelControlCluster to AllCLusters
    -   Fix Typing of Commands in ClusterClient if no commands were present
    -   Fix: Fixes equality checks in Attribute servers to check deeper than just === (and introduce new util method isDeepEqual)
    -   Fix: Makes sure an error received from sending subscription seed data reports is not bubbling up and activate subscription after successful seeding
    -   Fix: Allows Node.js Buffer objects to be persisted to storage as a Uint8Arrays that they subclass
    -   Fix: Fixes a Subscription timer duplication issue and collect attribute changes within a 50ms window to reduce the number of subscription messages
    -   Fix: Returns correct Error-Status for Read-/Write-/Subscribe- and Invoke-Requests
    -   Fix: Fixes TLV Encoding for strings with UTF8 relevant characters
    -   Fix: Adjusted DataVersion handling to track version on ClusterInstance level as required by Specs. Stored values that might got invalid by this change are deleted and recreated on next change.
    -   Refactor: Refactor Endpoint structuring and determination to allow dynamic and updating structures
-   matter.js API:
    -   Breaking:
        -   Adjusted some constructors of the new API and remove the option to pass an array of clusters to be added initially because this was no longer compatible to the strong typing in some places. Use addClusterServer and addClusterClient methods
        -   Endpoint ID parameter got replaced by an EndpointOptions structure that also allows to define a custom unique ID for endpoint structuring
        -   Composed devices objects should only be used on an Aggregator
    -   Deprecation: The classes MatterDevice and MatterController are deprecated to be used externally to the library and will be removed in later versions.
    -   Feature: Enhance Storage system to allow to create subcontext stores to allow better separation of data
    -   Feature: Allow to also remove devices from Aggregators
    -   Feature: Optionally allow to define discovery capabilities when generating Pairing code
    -   Feature: Add methods to CommissioningServer/Controller class to get information on active sessions and commissioned fabrics
    -   Feature: Enhance CommissioningController to allow subscribing to all attributes and events directly on startup
-   Reference implementation/Examples:
    -   Breaking: The storage key structure got changed to allow multi node operations within one process. This requires to change the storage key structure and to migrate or reset the storage.
        -   Migration: prepend any storage key except Device._ and Controller._ with "0." in the filename
    -   Deprecation: The CLI Examples LegacyDeviceNode and LegacyControllerNode is removed in this version! Use the new variants please.
    -   Change: The default storage names now start with a "." at the beginning to allow to hide them in some file explorers and git.
    -   Change: Example script are moved to package matter-node.js-examples
    -   Feature: The Device example script got a new parameter -ble to also initialize the Bluetooth transport layer
    -   Feature: The Controller example script got a new parameter -ble to also initialize the Bluetooth transport layer
    -   Feature: The Controller example script got a new parameters -ble-\* to provide Wi-Fi/Thread network credentials to use for device commissioning
    -   Feature: Add stopping of the example scripts to allow clean shutdown and sending shutdown Event
    -   Feature: Add CLI parameter to define the loglevel and log format; default log format changed to ANSI when executed in a shell/tty
    -   Feature: Log the endpoint structure of the device/commissioned device on start
-   Misc:
    -   Added Specification links for Matter Specifications 1.1
    -   Optimize typing exports for node10 TS settings
    -   Add optional parameter to define a uniqueID used in serial number of examples
    -   Add WIP package matter-node-shell.js with the goal to offer a node.js based shell-based controller implementation
    -   Add new util class EndpointStructureLogger which logs all endpoint details

## 0.4.0 (2023-05-16)

-   Matter-Core functionality:
    -   Deprecation: The classes MatterDevice and MatterController are deprecated to be used externally to the library and will be removed in later versions.
    -   Deprecation: The CLI Examples LegacyDeviceNode and LegacyControllerNode will be removed in next version! Use the new variants please.
    -   Feature: Generate global Attributes attributeList, acceptedCommandList and generatedCommandList when generating cluster servers (when used with New API!)
    -   Feature: (@digitaldan) Added decoding of Pairingcodes to determine discriminator and pin for Controller usage
    -   Feature: Provide the Endpoint as data field for command Handlers to allow to access the endpoint data and other clusters on that endpoint if needed
    -   Feature: Add Implementations of Scenes and Groups-Clusters (still to be tested with Controllers in depth!)
    -   Feature: Add ClusterExtend to allow building Feature-based conditional cluster definitions (and do that for OnOff/Network-Commissioning)
    -   Feature: Refactored Endpoint/Fabric aware Attributes with Getter functions to use Endpoint instance
    -   Feature: Added automatic API documentation generation (not included in npm package but can be build locally using npm run build-doc)
    -   Feature: Improved Command Invoke Logging
    -   Adjustment: Do not send empty arrays for empty subscription messages to further shorten the payload
    -   Fix: Respond with Unsupported Command when a unknown command is received and log the error
    -   Fix: Increase the array maximum size according to specs
    -   Fix: Fixed internal TlvTag representation to allow also decoding of the internal object format of a Tlv stream
    -   Fix: Adjust internal tag encoding to not use {} when empty
-   matter.js API:
    -   Feature: Introduce new High level API, see [API.md](./packages/matter.js/API.md) for details!
    -   Breaking: Move DeviceTypes.ts from common to device directory and rename DEVICE to "DeviceTypes"
    -   Breaking: ClusterClient interface names changed to get/set/subscribeNAMEAttribute to prevent overlapping with commands
    -   Breaking: Revamp internal APIs and convert ClusterServer into an object approach to allow dynamic methods to be defined for get/set/subscribe and streamline the API between ClusterClient and ClusterServer
    -   Feature: Introduce NamedHandler util class for an event style typed and named handler/callback approach
    -   Feature: Use NamedHandler as commandHandler to forward command calls like identify to the Device classes and testEvenTriggered for commissionable node class
    -   Feature: Add constructor value to hand over initial values of the onoff Cluster when initialing the default cluster
    -   Feature: make sure BridgedBasicInformation cluster is always set when adding a bridged device and no data parameters were provided
    -   Feature: (@lauckhart) Enhance Logging framework to also allow ANSI and HTML colored output and added some features, details see #129
-   matter-node.js:
    -   Breaking: Remove the exposed legacy API classes (MatterDevice/MatterController) and legacy examples from the exported lists
    -   Feature: Autoregister Crypto, Time and Network in their Node.js variants when including packages from @project-chip/matter-node.js root package but only if not yet registered (so can be overridden by the developer)
    -   Examples/Reference implementations:
        -   The reference implementations are moved to example directory and details moved into own [README.md](./packages/matter-node.js-examples/README.md) file
        -   the "npm run matter" command got renamed to "npm run matter-device" (same for binary usage
        -   Add hints for all imports in the examples to show what the corresponding "matter-node.js" import would be (because they cannot be used directly for build reasons)
        -   Added the "npm run matter-\*" commands also to the base package.json
        -   Added parameter -clearstorage to start with an empty storage

## 0.3.0 (2023-05-03)

-   Initial release of matter.js and matter-node.js packages after the code merge
-   From now on we will add a changelog for each release

## < 0.3.0

-   Releases of matter.js with initial Logic
