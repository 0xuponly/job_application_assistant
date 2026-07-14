// Pure, deterministic Fit heuristic used both as a fast path and as a fallback
// when the LLM scorer is rate-limited or otherwise unavailable. No I/O, no
// external state, safe to import from anywhere.

const TECH_SKILLS = new Set([
  'python', 'javascript', 'typescript', 'java', 'go', 'golang', 'rust', 'c++', 'c#', 'ruby', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'svelte', 'node', 'nodejs', 'express', 'django', 'flask', 'spring', 'rails',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'ci/cd',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'rabbitmq',
  'graphql', 'rest', 'grpc', 'api', 'microservices',
  'machine learning', 'deep learning', 'ai', 'nlp', 'computer vision', 'data science',
  'blockchain', 'solidity', 'web3', 'ethereum', 'smart contract', 'defi',
  'linux', 'git', 'agile', 'scrum', 'jira', 'figma',
  'product management', 'project management', 'leadership', 'strategy',
  'finance', 'accounting', 'audit', 'compliance', 'risk management',
  'marketing', 'sales', 'business development', 'operations'
])

const ROLE_INDICATORS = [
  'engineer', 'developer', 'architect', 'manager', 'director', 'lead', 'head', 'chief',
  'scientist', 'analyst', 'specialist', 'consultant', 'coordinator', 'administrator',
  'designer', 'researcher', 'associate', 'president', 'vp', 'vice president',
  'intern', 'fellow', 'principal', 'staff', 'senior', 'junior', 'mid-level', 'entry'
]

export function extractTechnicalTerms(text: string): Set<string> {
  const terms = new Set<string>()
  const lower = text.toLowerCase()

  for (const skill of TECH_SKILLS) {
    if (lower.includes(skill)) terms.add(skill)
  }

  const words = lower.split(/[^a-z0-9+#.]+/)
  for (const w of words) {
    if (w.length > 3 && !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|has|have|with|this|that|from|they|been|were|will|would|could|should|their|there|which|when|what|about|into|than|then|some)$/.test(w)) {
      terms.add(w)
    }
  }

  return terms
}

export function extractRoleTitles(text: string): string[] {
  const roles: string[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    const lower = line.toLowerCase().trim()
    const hasIndicator = ROLE_INDICATORS.some(r => lower.includes(r))
    if (hasIndicator && lower.length < 120) {
      roles.push(lower)
    }
  }
  return roles
}

const EDUCATION_ORDER: Record<string, number> = {
  'phd': 5, 'ph.d.': 5, 'doctorate': 5, 'doctoral': 5,
  'master': 4, "master's": 4, 'masters': 4, 'ma': 4, 'ms': 4, 'mba': 4, 'm.s.': 4, 'm.a.': 4,
  'bachelor': 3, "bachelor's": 3, 'bachelors': 3, 'ba': 3, 'bs': 3, 'b.s.': 3, 'b.a.': 3,
  'associate': 2, "associate's": 2, 'associates': 2, 'a.s.': 2, 'a.a.': 2
}

export function extractEducationLevel(text: string): number {
  const lower = text.toLowerCase()
  let maxLevel = 0
  for (const [keyword, level] of Object.entries(EDUCATION_ORDER)) {
    if (lower.includes(keyword) && level > maxLevel) maxLevel = level
  }
  return maxLevel
}

export function extractYearsExperience(text: string): number {
  const lower = text.toLowerCase()
  let maxYears = 0
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?experience/g,
    /(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)/g
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(lower)) !== null) {
      const years = Math.max(...match.slice(1).filter(Boolean).map(Number))
      if (years > maxYears) maxYears = years
    }
  }
  return maxYears
}

export function scoreCompatibility(jobTitle: string, jobDesc: string | null, baseCv: string): number {
  if (!baseCv) return 0.5

  const cvLower = baseCv.toLowerCase()
  const descText = (`${jobTitle  } ${  jobDesc || ''}`).toLowerCase()

  const cvSkills = extractTechnicalTerms(cvLower)
  const jobSkills = extractTechnicalTerms(descText)

  if (cvSkills.size === 0) return 0.3

  let intersect = 0
  for (const s of jobSkills) {
    if (cvSkills.has(s)) intersect++
  }

  const skillScore = cvSkills.size > 0 ? intersect / Math.min(jobSkills.size, cvSkills.size) : 0

  const cvRoles = extractRoleTitles(cvLower)
  const jobTitleLower = jobTitle.toLowerCase()
  let roleScore = 0
  for (const role of cvRoles) {
    const roleWords = role.split(/[^a-z0-9]+/).filter(w => w.length > 2)
    const titleWords = jobTitleLower.split(/[^a-z0-9]+/).filter(w => w.length > 2)
    const matchCount = roleWords.filter(rw => titleWords.some(tw => tw === rw || tw.includes(rw) || rw.includes(tw))).length
    if (matchCount >= Math.min(2, roleWords.length / 2)) {
      roleScore = 1
      break
    }
  }

  const hasRelevantKeywords = /engineer|developer|architect|manager|analyst|scientist|designer|consultant|intern/i.test(jobTitleLower)
  const keywordBonus = hasRelevantKeywords ? 0.15 : 0

  const score = skillScore * 0.6 + roleScore * 0.3 + keywordBonus
  return Math.min(score, 1)
}
