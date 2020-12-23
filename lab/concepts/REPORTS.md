
BUILDER (cranes, baggers, mixer)   are    DATDOT  (attestors, hosters, encoders)
=> a pool of (employees/sub-contractors)
                                           => a pool of (providers)



PROJECTS (airport, street, garage)   are  JOBS (proof_challenge, storage_challenge, hosting_contract, retry_contract)
=> a queue/schedule of project orders
                                          => a queue/schedule of jobs/contracts


1. realtime/just-in-time, not providers marking availability in the future
2. convenience for end users to earn


providers have:
- reliability score (e.g. 98% reliable)
- quality score - bandwidth/latency/etc... average measured scores
  - does provider X have a required quality in region X

```javascript
user.rating = {
  region1: { quality, reliability },
  region2: { quality, reliability },
  region3: { quality, reliability },
}
// 1. we have for each region a list of attestors, those lists update all the time
//  => moving providers means moving regions
// 2. we assign each performance attestation the attestor.region and other properties of the attestor who executed the attestation
// 3. we get a list attestations for each reagion
// 4. for a providerX: we have a list of attestations from many attestors from different regions


// if we want to assign a job (e.g. hosting plan/contracts), for each of 7 required providers:
// 1. we take a providerX
// 2. we take all the reports we have about providerX
// 3. we consider only reports where: the `job.regions.includes(report.region)` // region from attestor when report was submitted


// we decide, whether a provider fits a job description, based on all reports that are relevant
// => in order to check the provider, we instead check all attestations about the provider, which match the job

user.hoster = {
  form: { },
  measured_at_registration: {},
  measured_by_attestors: {},
  self_reports: {},
}
user.attestor = {
  form: {},
  measured_at_registration: {},
  measured_by_attestors: {},
  // self_reports: {},
}

user.hoster = {
  form: {
    from:,
    until,
    performance: { bandwidth, latency, speed },
    storage_availability
    ...
  },
  reports: {
    rating: {
      region1: {reliability, quality},
      region2: {reliability, quality},
      region3: {reliability, quality},
    },
    performance: {
      region1:  {bandwidth, latency, speed}, // <= updates with every new report
      region2:  {bandwidth, latency, speed},
      region3:  {bandwidth, latency, speed},

    }
  }
}

plan.regions = [ region1]


```


dynamic provider-pool
- drop in rate
- drop out rate (of providers)
- list providers in the pool
