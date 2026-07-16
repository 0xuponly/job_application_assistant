// Classification of job boards by category. A board is listed under a
// category ONLY if it is exclusively that type (general job boards that
// include crypto jobs are not classified as Crypto, etc).
export const BOARD_TYPES: { label: string; boards: string[] }[] = [
  {
    label: 'Crypto',
    boards: [
      'Crypto Careers',
      'Cryptorecruit',
      'Cryptocurrency Jobs',
      'CryptoJobsList',
      'cryptojobs.com',
      'Crypto.jobs',
      'Web3.career',
      'Braintrust'
    ]
  },
  {
    label: 'Remote',
    boards: [
      'Remote OK',
      'We Work Remotely',
      'Remotive',
      'Remote.co',
      'Working Nomads',
      'JustRemote',
      'Remote3'
    ]
  },
  {
    label: 'Startup',
    boards: [
      'Startup.jobs',
      'Built In',
      'Built In Toronto',
      'Built In Vancouver',
      'Wellfound',
      'Y Combinator',
      'Top Startups',
      'Rocketships'
    ]
  },
  {
    label: 'Canadian',
    boards: [
      'Indeed Canada',
      'Job Bank (GC)',
      'Eluta.ca',
      'Workopolis',
      'Jobboom',
      'WorkBC',
      'CareerBeacon',
      'Vancouver Jobs',
      'UToronto',
      'Northern Health'
    ]
  },
  {
    label: 'Nonprofit',
    boards: [
      'CharityVillage',
      'Idealist'
    ]
  },
  {
    label: 'General',
    boards: [
      'Google Careers',
      'CareerHound'
    ]
  }
]
