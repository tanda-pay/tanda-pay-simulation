The TandaPay simulation's number-crunching logic is found in src/app/service/tandapay.simulation.service.ts. The rules of TandaPay are laid out in that script, and it depends on src/app/model/policy-holder.ts and src/app/model/tandapay-state.ts to store state and model decisions.

-policy-holder.ts contains the PolicyHolder class, which encapsulates the decisions/unique attributes of the TandaPay policyholders. When the simulation needs policyholder's to make a decision, it calls functions from this class.

-tandapay-state.ts contains the TandapayState class, which is just a class that contains fields that tandapay.simulation.service.ts cares about. An array of PolicyHolder objects and an instance of a TandapayState should completely store all of the information of a TandaPay simulation.

-src/app/model/user-input.ts has a class which contains fields for all of the settings that goes into initializing a simulation

-src/app/service/simulation.setup.service.ts processes a userInput instance an initializes policyholders and simulation state accordingly

The rest of the repository contains Angular modules/building-blocks for binding the web application to the settings and simulation data.
