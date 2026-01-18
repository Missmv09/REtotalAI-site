/**
 * FairHousingScanner.js
 * Comprehensive Fair Housing Act Compliance Scanner
 *
 * Scans text for potential Fair Housing violations including:
 * - 7 Federal Protected Classes (FHA §3604)
 * - State-specific protections (50 states + DC)
 * - California FEHA/Unruh Act violations
 * - Severity levels (high, medium, low)
 * - Law citations
 *
 * @version 2.0.0
 * @license MIT
 */

(function(global) {
    'use strict';

    // ============================================
    // STATE PROTECTIONS DATABASE
    // ============================================
    const stateProtections = {
        // All states have federal protections
        // Additional state-specific protections listed below

        'AL': { name: 'Alabama', additional: [] },
        'AK': { name: 'Alaska', additional: ['marital_status'] },
        'AZ': { name: 'Arizona', additional: ['marital_status'] },
        'AR': { name: 'Arkansas', additional: [] },
        'CA': {
            name: 'California',
            additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'genetic_information', 'medical_condition', 'primary_language', 'immigration_status', 'military_status', 'ancestry', 'arbitrary_discrimination'],
            laws: ['FEHA (Gov. Code §12955)', 'Unruh Civil Rights Act (Civ. Code §51)']
        },
        'CO': { name: 'Colorado', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'ancestry', 'creed'] },
        'CT': { name: 'Connecticut', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'ancestry'] },
        'DE': { name: 'Delaware', additional: ['marital_status', 'sexual_orientation', 'gender_identity', 'creed'] },
        'DC': { name: 'District of Columbia', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'political_affiliation', 'matriculation', 'personal_appearance'] },
        'FL': { name: 'Florida', additional: ['marital_status'] },
        'GA': { name: 'Georgia', additional: [] },
        'HI': { name: 'Hawaii', additional: ['marital_status', 'sexual_orientation', 'gender_identity', 'ancestry', 'hiv_aids'] },
        'ID': { name: 'Idaho', additional: [] },
        'IL': { name: 'Illinois', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'military_status', 'ancestry', 'unfavorable_discharge'] },
        'IN': { name: 'Indiana', additional: ['ancestry'] },
        'IA': { name: 'Iowa', additional: ['sexual_orientation', 'gender_identity', 'creed'] },
        'KS': { name: 'Kansas', additional: ['ancestry'] },
        'KY': { name: 'Kentucky', additional: [] },
        'LA': { name: 'Louisiana', additional: [] },
        'ME': { name: 'Maine', additional: ['source_of_income', 'sexual_orientation', 'gender_identity', 'ancestry'] },
        'MD': { name: 'Maryland', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'ancestry'] },
        'MA': { name: 'Massachusetts', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'ancestry', 'military_status', 'age', 'genetic_information'] },
        'MI': { name: 'Michigan', additional: ['marital_status'] },
        'MN': { name: 'Minnesota', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'creed', 'public_assistance'] },
        'MS': { name: 'Mississippi', additional: [] },
        'MO': { name: 'Missouri', additional: ['ancestry'] },
        'MT': { name: 'Montana', additional: ['marital_status', 'age', 'creed'] },
        'NE': { name: 'Nebraska', additional: ['marital_status', 'ancestry'] },
        'NV': { name: 'Nevada', additional: ['sexual_orientation', 'gender_identity', 'ancestry'] },
        'NH': { name: 'New Hampshire', additional: ['marital_status', 'sexual_orientation', 'age'] },
        'NJ': { name: 'New Jersey', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'ancestry', 'domestic_partnership', 'civil_union'] },
        'NM': { name: 'New Mexico', additional: ['sexual_orientation', 'gender_identity', 'ancestry', 'spousal_affiliation'] },
        'NY': { name: 'New York', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'military_status', 'age', 'lawful_occupation', 'citizenship_status'] },
        'NC': { name: 'North Carolina', additional: [] },
        'ND': { name: 'North Dakota', additional: ['marital_status', 'public_assistance'] },
        'OH': { name: 'Ohio', additional: ['marital_status', 'ancestry', 'military_status'] },
        'OK': { name: 'Oklahoma', additional: [] },
        'OR': { name: 'Oregon', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity'] },
        'PA': { name: 'Pennsylvania', additional: ['ancestry'] },
        'RI': { name: 'Rhode Island', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'ancestry', 'age'] },
        'SC': { name: 'South Carolina', additional: [] },
        'SD': { name: 'South Dakota', additional: ['ancestry', 'creed'] },
        'TN': { name: 'Tennessee', additional: [] },
        'TX': { name: 'Texas', additional: [] },
        'UT': { name: 'Utah', additional: ['source_of_income', 'sexual_orientation', 'gender_identity'] },
        'VT': { name: 'Vermont', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'age'] },
        'VA': { name: 'Virginia', additional: ['source_of_income', 'sexual_orientation', 'gender_identity', 'military_status'] },
        'WA': { name: 'Washington', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'gender_identity', 'military_status', 'veteran_status'] },
        'WV': { name: 'West Virginia', additional: ['ancestry'] },
        'WI': { name: 'Wisconsin', additional: ['source_of_income', 'marital_status', 'sexual_orientation', 'ancestry', 'lawful_source_of_income'] },
        'WY': { name: 'Wyoming', additional: [] }
    };

    // Federal protected classes (apply to all states)
    const federalProtectedClasses = [
        'race', 'color', 'religion', 'national_origin', 'sex', 'familial_status', 'disability'
    ];

    // Protection display names
    const protectionNames = {
        'race': 'Race',
        'color': 'Color',
        'religion': 'Religion',
        'national_origin': 'National Origin',
        'sex': 'Sex',
        'familial_status': 'Familial Status',
        'disability': 'Disability',
        'source_of_income': 'Source of Income',
        'marital_status': 'Marital Status',
        'sexual_orientation': 'Sexual Orientation',
        'gender_identity': 'Gender Identity/Expression',
        'military_status': 'Military/Veteran Status',
        'veteran_status': 'Veteran Status',
        'age': 'Age',
        'ancestry': 'Ancestry',
        'genetic_information': 'Genetic Information',
        'medical_condition': 'Medical Condition',
        'primary_language': 'Primary Language',
        'immigration_status': 'Immigration/Citizenship Status',
        'citizenship_status': 'Citizenship Status',
        'creed': 'Creed',
        'public_assistance': 'Public Assistance Status',
        'political_affiliation': 'Political Affiliation',
        'matriculation': 'Matriculation',
        'personal_appearance': 'Personal Appearance',
        'domestic_partnership': 'Domestic Partnership',
        'civil_union': 'Civil Union Status',
        'spousal_affiliation': 'Spousal Affiliation',
        'lawful_occupation': 'Lawful Occupation',
        'lawful_source_of_income': 'Lawful Source of Income',
        'hiv_aids': 'HIV/AIDS Status',
        'unfavorable_discharge': 'Unfavorable Military Discharge',
        'arbitrary_discrimination': 'Arbitrary Discrimination'
    };

    // ============================================
    // VIOLATION PATTERNS DATABASE
    // ============================================
    const violationPatterns = [
        // ============================================
        // RACE, COLOR, NATIONAL ORIGIN - HIGH SEVERITY
        // ============================================
        {
            pattern: /\b(whites?|blacks?|african[- ]?americans?|asians?|hispanics?|latinos?|latinas?|mexicans?|chinese|japanese|korean|indian|arab|middle[- ]?eastern)\s+(only|preferred|welcome|neighborhood|area|community)\b/gi,
            category: 'race',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove racial/ethnic references. Describe property features instead.'
        },
        {
            pattern: /\b(no|not for|excludes?|without)\s+(minorities|blacks?|whites?|asians?|hispanics?|latinos?|mexicans?|african[- ]?americans?)\b/gi,
            category: 'race',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove exclusionary racial language completely.'
        },
        // Catch "lots of black people", "many white families", etc.
        {
            pattern: /\b(lots?\s+of|many|full\s+of|mostly|all|predominantly)\s+(black|white|asian|hispanic|latino|latina|mexican|african|chinese|indian|arab)\s+(people|persons?|folks?|families|residents?|neighbors?)\b/gi,
            category: 'race',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove all references to racial/ethnic demographics of the neighborhood.'
        },
        // Catch standalone racial terms in neighborhood context
        {
            pattern: /\bneighborhood[:\s]+(lots?\s+of\s+)?(black|white|asian|hispanic|latino|mexican|african)\b/gi,
            category: 'race',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove racial descriptions of neighborhoods.'
        },
        {
            pattern: /\b(diverse|diversity|ethnic|ethnically|integrated|segregated|changing)\s+(neighborhood|community|area)\b/gi,
            category: 'race',
            severity: 'medium',
            law: 'FHA §3604(a)',
            suggestion: 'Avoid coded racial language. Describe amenities and features instead.'
        },
        {
            pattern: /\b(good|safe|bad|dangerous|crime[- ]?free|low[- ]?crime|poor|rough|sketchy|ghetto|hood)\s+(neighborhood|area|community)\b/gi,
            category: 'race',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove subjective/derogatory neighborhood descriptions. These terms may imply racial steering.'
        },
        // Catch "very poor neighborhood", "really bad area"
        {
            pattern: /\b(very|really|extremely|super)\s+(poor|bad|rough|dangerous|sketchy)\s+(neighborhood|area|community)\b/gi,
            category: 'race',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove derogatory neighborhood descriptions that may imply racial steering.'
        },
        {
            pattern: /\bexclusive\s+(neighborhood|community|area|enclave)\b/gi,
            category: 'race',
            severity: 'medium',
            law: 'FHA §3604(a)',
            suggestion: 'Replace "exclusive" with specific amenity descriptions.'
        },
        {
            pattern: /\b(up[- ]?and[- ]?coming|gentrifying|transitional|changing)\s+(neighborhood|area|community)\b/gi,
            category: 'race',
            severity: 'medium',
            law: 'FHA §3604(a)',
            suggestion: 'Avoid terms associated with neighborhood demographic changes.'
        },

        // ============================================
        // RELIGION - HIGH SEVERITY
        // ============================================
        {
            pattern: /\b(christian|jewish|muslim|catholic|baptist|protestant|buddhist|hindu|mormon|islamic)\s+(only|preferred|community|neighborhood|families?)\b/gi,
            category: 'religion',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove religious preferences or requirements.'
        },
        {
            pattern: /\b(no|not for|excludes?)\s+(christians?|jews?|muslims?|catholics?|buddhists?|hindus?)\b/gi,
            category: 'religion',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove exclusionary religious language.'
        },
        {
            pattern: /\b(steps?|minutes?|blocks?|walking distance)\s+(from|to|away from)\s+(church|mosque|synagogue|temple|cathedral)\b/gi,
            category: 'religion',
            severity: 'medium',
            law: 'FHA §3604(a)',
            suggestion: 'Avoid proximity to religious institutions as a selling point (potential steering).'
        },
        {
            pattern: /\bnear\s+(church|mosque|synagogue|temple)\b/gi,
            category: 'religion',
            severity: 'medium',
            law: 'FHA §3604(a)',
            suggestion: 'Avoid highlighting proximity to religious institutions.'
        },

        // ============================================
        // FAMILIAL STATUS - HIGH SEVERITY
        // ============================================
        {
            pattern: /\b(no|not for|excludes?|without)\s+(children|kids|babies|infants|minors|families)\b/gi,
            category: 'familial_status',
            severity: 'high',
            law: 'FHA §3604(b)',
            suggestion: 'Remove restrictions on children/families. Only 55+ communities with proper HOPA exemption may restrict.'
        },
        {
            pattern: /\b(adults?|singles?|couples?)\s+only\b/gi,
            category: 'familial_status',
            severity: 'high',
            law: 'FHA §3604(b)',
            suggestion: 'Remove "adults only" language unless property qualifies for 55+ HOPA exemption.'
        },
        {
            pattern: /\bno\s+roommates?\b/gi,
            category: 'familial_status',
            severity: 'high',
            law: 'FHA §3604(b)',
            suggestion: 'Remove roommate restrictions (may discriminate against families).'
        },
        {
            pattern: /\bmature\s+(couple|adults?|persons?)\s+(only|preferred)\b/gi,
            category: 'familial_status',
            severity: 'high',
            law: 'FHA §3604(b)',
            suggestion: 'Remove age/maturity requirements for tenants.'
        },
        {
            pattern: /\b(perfect for|ideal for|great for)\s+(singles?|retired|elderly|retirees|empty[- ]?nesters?)\b/gi,
            category: 'familial_status',
            severity: 'medium',
            law: 'FHA §3604(b)',
            suggestion: 'Avoid targeting specific demographics. Describe property features instead.'
        },
        {
            pattern: /\b(mother|father|in-law|mother-in-law|father-in-law)\s*(suite|apartment|quarters)\b/gi,
            category: 'familial_status',
            severity: 'low',
            law: 'FHA §3604(b)',
            suggestion: 'Consider using "guest suite" or "accessory dwelling unit" instead.'
        },
        {
            pattern: /\b(nanny|au\s*pair)\s*(suite|room|quarters)\b/gi,
            category: 'familial_status',
            severity: 'low',
            law: 'FHA §3604(b)',
            suggestion: 'Consider using "guest suite" or "additional living space" instead.'
        },

        // ============================================
        // DISABILITY - HIGH SEVERITY
        // ============================================
        {
            pattern: /\b(no|not for|excludes?)\s+(disabled|handicapped|wheelchairs?|blind|deaf)\b/gi,
            category: 'disability',
            severity: 'high',
            law: 'FHA §3604(f)',
            suggestion: 'Remove all disability-based exclusions. Reasonable accommodations required by law.'
        },
        {
            pattern: /\b(able[- ]?bodied|physically fit|healthy)\s+(only|required|preferred|tenants?)\b/gi,
            category: 'disability',
            severity: 'high',
            law: 'FHA §3604(f)',
            suggestion: 'Remove physical ability requirements.'
        },
        {
            pattern: /\bcrippled\b/gi,
            category: 'disability',
            severity: 'high',
            law: 'FHA §3604(f)',
            suggestion: 'Remove offensive disability terminology.'
        },
        {
            pattern: /\bwheelchair[- ]?bound\b/gi,
            category: 'disability',
            severity: 'medium',
            law: 'FHA §3604(f)',
            suggestion: 'Use "wheelchair accessible" or "wheelchair user friendly" instead.'
        },
        {
            pattern: /\bmentally\s+(ill|retarded|challenged|disabled)\b/gi,
            category: 'disability',
            severity: 'high',
            law: 'FHA §3604(f)',
            suggestion: 'Remove mental health references. Use person-first language if necessary.'
        },
        {
            pattern: /\b(handicapped|invalid)\s+(person|people|resident)/gi,
            category: 'disability',
            severity: 'medium',
            law: 'FHA §3604(f)',
            suggestion: 'Use "person with disability" or "accessible" instead.'
        },
        {
            pattern: /\bsuffering\s+from\b/gi,
            category: 'disability',
            severity: 'low',
            law: 'FHA §3604(f)',
            suggestion: 'Avoid describing medical conditions. Use neutral language.'
        },
        {
            pattern: /\bwalking\s+distance\b/gi,
            category: 'disability',
            severity: 'low',
            law: 'FHA §3604(f)',
            suggestion: 'Consider using "short distance" or specific measurements instead.'
        },

        // ============================================
        // SEX / GENDER - HIGH SEVERITY
        // ============================================
        {
            pattern: /\b(females?|males?|women|men|ladies|gentlemen)\s+only\b/gi,
            category: 'sex',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove gender-based restrictions.'
        },
        {
            pattern: /\b(no|not for)\s+(females?|males?|women|men)\b/gi,
            category: 'sex',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove gender-based exclusions.'
        },
        {
            pattern: /\b(bachelor|bachelorette)\s+pad\b/gi,
            category: 'sex',
            severity: 'low',
            law: 'FHA §3604(a)',
            suggestion: 'Consider using "studio" or "one-bedroom" instead.'
        },
        {
            pattern: /\bman\s*cave\b/gi,
            category: 'sex',
            severity: 'low',
            law: 'FHA §3604(a)',
            suggestion: 'Consider using "bonus room", "game room", or "recreation room" instead.'
        },
        {
            pattern: /\bhis\s+and\s+hers?\b/gi,
            category: 'sex',
            severity: 'low',
            law: 'FHA §3604(a)',
            suggestion: 'Consider using "dual" or "double" instead.'
        },
        {
            pattern: /\bmaster\s+(bedroom|suite|bath|bathroom|closet)\b/gi,
            category: 'sex',
            severity: 'low',
            law: 'FHA §3604(a)',
            suggestion: 'Consider using "primary" instead of "master".'
        },

        // ============================================
        // NATIONAL ORIGIN - HIGH SEVERITY
        // ============================================
        {
            pattern: /\b(americans?|citizens?|us\s+citizens?)\s+only\b/gi,
            category: 'national_origin',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove citizenship/nationality requirements.'
        },
        {
            pattern: /\benglish\s+(speakers?|speaking)\s+only\b/gi,
            category: 'national_origin',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove language requirements.'
        },
        {
            pattern: /\b(no|not for)\s+(immigrants?|foreigners?|aliens?)\b/gi,
            category: 'national_origin',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove immigration-status based exclusions.'
        },
        {
            pattern: /\bmust\s+speak\s+english\b/gi,
            category: 'national_origin',
            severity: 'high',
            law: 'FHA §3604(a)',
            suggestion: 'Remove English language requirements.'
        },

        // ============================================
        // SEXUAL ORIENTATION / GENDER IDENTITY
        // (Protected in many states)
        // ============================================
        {
            pattern: /\b(gay|lesbian|lgbtq\+?|transgender|straight|heterosexual)\s*(friendly|unfriendly|community|neighborhood|area|couples?)\b/gi,
            category: 'sexual_orientation',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Remove sexual orientation/gender identity references.'
        },
        {
            pattern: /\b(same[- ]?sex|opposite[- ]?sex)\s*(couples?|partners?)\b/gi,
            category: 'sexual_orientation',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Remove references to couples\' sexual orientation.'
        },
        // Catch "no gays", "no gays allowed", "gays not allowed", "no lesbians", etc.
        {
            pattern: /\b(no|not for)\s+(gays?|lesbians?|lgbtq\+?|transgender|homosexuals?|queers?)\b/gi,
            category: 'sexual_orientation',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Remove LGBTQ+ exclusionary language. This is discriminatory.'
        },
        {
            pattern: /\b(gays?|lesbians?|homosexuals?|queers?|transgenders?)\s+(not\s+)?(allowed|welcome|wanted|accepted|permitted)\b/gi,
            category: 'sexual_orientation',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Remove LGBTQ+ exclusionary language. This is discriminatory.'
        },
        // Catch standalone discriminatory phrases
        {
            pattern: /\b(no|ban|exclude|excluding)\s+(gays?|lesbians?|homosexuals?|lgbtq\+?)\b/gi,
            category: 'sexual_orientation',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Remove LGBTQ+ exclusionary language.'
        },

        // ============================================
        // SOURCE OF INCOME (Protected in many states)
        // ============================================
        {
            pattern: /\bno\s+section[- ]?8\b/gi,
            category: 'source_of_income',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Section 8/housing voucher discrimination is illegal in many states. Check local laws.'
        },
        {
            pattern: /\b(no|not accepting?|don\'?t accept)\s+(vouchers?|housing\s+vouchers?|housing\s+assistance|housing\s+subsidies?|hcv|hap)\b/gi,
            category: 'source_of_income',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Voucher/subsidy discrimination is illegal in many states.'
        },
        {
            pattern: /\bno\s+(welfare|public\s+assistance|government\s+assistance)\b/gi,
            category: 'source_of_income',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Public assistance discrimination is illegal in many states.'
        },
        {
            pattern: /\bmust\s+earn\s+\d+x\s+(the\s+)?rent\b/gi,
            category: 'source_of_income',
            severity: 'medium',
            law: 'State Fair Housing Laws',
            suggestion: 'Income multiplier requirements may violate source of income protections in some states.'
        },
        {
            pattern: /\b(minimum\s+income|income\s+requirements?|verify\s+employment)\b/gi,
            category: 'source_of_income',
            severity: 'low',
            law: 'State Fair Housing Laws',
            suggestion: 'Income verification policies should not discriminate against lawful income sources.'
        },

        // ============================================
        // MARITAL STATUS (Protected in many states)
        // ============================================
        {
            pattern: /\b(married|single|divorced|unmarried|widowed)\s*(only|preferred|couples?)\b/gi,
            category: 'marital_status',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Marital status is protected in many states. Remove these requirements.'
        },
        {
            pattern: /\b(no\s+unmarried|married\s+couples?\s+only)\b/gi,
            category: 'marital_status',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Remove marital status requirements.'
        },

        // ============================================
        // MILITARY / VETERAN STATUS
        // ============================================
        {
            pattern: /\bno\s+(military|veterans?|service\s*members?|active\s+duty)\b/gi,
            category: 'military_status',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Military/veteran status is protected in many states.'
        },
        {
            pattern: /\b(civilians?\s+only|non[- ]?military\s+only)\b/gi,
            category: 'military_status',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Remove military status restrictions.'
        },

        // ============================================
        // AGE (Protected in some states)
        // ============================================
        {
            pattern: /\b(young|old)\s+(professionals?|couples?|people)\s+only\b/gi,
            category: 'age',
            severity: 'high',
            law: 'State Fair Housing Laws',
            suggestion: 'Age discrimination is prohibited in many states.'
        },
        {
            pattern: /\bseniors?\s+only\b/gi,
            category: 'age',
            severity: 'medium',
            law: 'FHA HOPA Exemption',
            suggestion: 'Only valid for 55+ communities with proper HOPA exemption documentation.'
        },
        {
            pattern: /\b(millennials?|gen[- ]?z|zoomers?|boomers?|baby\s*boomers?)\b/gi,
            category: 'age',
            severity: 'medium',
            law: 'State Fair Housing Laws',
            suggestion: 'Avoid generational demographic targeting.'
        },
        {
            pattern: /\b(elderly|senior\s*citizens?|old\s+folks?|young\s+crowd)\b/gi,
            category: 'age',
            severity: 'medium',
            law: 'State Fair Housing Laws',
            suggestion: 'Avoid age-based demographic descriptions.'
        },
        {
            pattern: /\bempty[- ]?nesters?\b/gi,
            category: 'age',
            severity: 'low',
            law: 'State Fair Housing Laws',
            suggestion: 'Consider describing property features instead of target demographics.'
        },

        // ============================================
        // CALIFORNIA-SPECIFIC (FEHA / UNRUH)
        // ============================================
        {
            pattern: /\b(spanish|mandarin|cantonese|vietnamese|tagalog|korean)\s+(speakers?|speaking)\s+(only|preferred|required)\b/gi,
            category: 'primary_language',
            severity: 'high',
            law: 'CA FEHA & Unruh Act',
            suggestion: 'Language requirements violate California fair housing law.',
            stateSpecific: ['CA']
        },
        {
            pattern: /\b(cancer|hiv|aids|diabetes|epilepsy)\s+(free|patients?|sufferers?)\b/gi,
            category: 'medical_condition',
            severity: 'high',
            law: 'CA FEHA',
            suggestion: 'Medical condition discrimination is illegal in California.',
            stateSpecific: ['CA']
        },
        {
            pattern: /\b(no\s+pets\s+except\s+service\s+animals?)\b/gi,
            category: 'disability',
            severity: 'low',
            law: 'FHA §3604(f)(3)(B)',
            suggestion: 'Note: Reasonable accommodation requests must be handled individually. Emotional support animals are also protected.'
        }
    ];

    // ============================================
    // CORE SCANNING FUNCTIONS
    // ============================================

    /**
     * Scan text for Fair Housing violations
     * @param {string} text - The text to scan
     * @param {string|null} stateCode - Optional 2-letter state code for state-specific checks
     * @returns {Array} Array of violation objects
     */
    function scan(text, stateCode = null) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const violations = [];
        const stateProtectionList = stateCode ? getStateProtections(stateCode) : federalProtectedClasses;
        const seenPhrases = new Set();

        for (const rule of violationPatterns) {
            // Skip state-specific patterns if not in that state
            if (rule.stateSpecific && stateCode && !rule.stateSpecific.includes(stateCode.toUpperCase())) {
                continue;
            }

            // Check if this category is protected
            const isProtected = stateProtectionList.includes(rule.category) ||
                                federalProtectedClasses.includes(rule.category);

            // For source_of_income, marital_status, etc., only flag if protected in state
            const stateOnlyCategories = ['source_of_income', 'marital_status', 'sexual_orientation',
                                         'gender_identity', 'military_status', 'age', 'primary_language',
                                         'medical_condition', 'ancestry'];

            if (stateOnlyCategories.includes(rule.category) && !isProtected && stateCode) {
                continue;
            }

            const matches = text.match(rule.pattern);
            if (matches) {
                for (const match of matches) {
                    const phrase = match.trim();
                    const phraseKey = phrase.toLowerCase();

                    // Avoid duplicate violations for the same phrase
                    if (!seenPhrases.has(phraseKey)) {
                        seenPhrases.add(phraseKey);

                        violations.push({
                            phrase: phrase,
                            category: rule.category,
                            categoryName: protectionNames[rule.category] || rule.category,
                            severity: rule.severity,
                            law: adjustLawCitation(rule.law, stateCode),
                            suggestion: rule.suggestion,
                            stateSpecific: rule.stateSpecific || null,
                            isProtectedInState: isProtected
                        });
                    }
                }
            }
        }

        // Sort by severity (high > medium > low)
        const severityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return violations;
    }

    /**
     * Adjust law citation based on state
     */
    function adjustLawCitation(baseLaw, stateCode) {
        if (!stateCode) return baseLaw;

        const state = stateProtections[stateCode.toUpperCase()];
        if (state && state.laws && state.laws.length > 0) {
            if (baseLaw.includes('State Fair Housing Laws')) {
                return state.laws.join(' & ');
            }
        }
        return baseLaw;
    }

    /**
     * Quick scan for compliance check
     * @param {string} text - The text to scan
     * @param {string|null} stateCode - Optional state code
     * @returns {Object} { isCompliant, count, hasHighRisk, highCount, mediumCount, lowCount }
     */
    function quickScan(text, stateCode = null) {
        const violations = scan(text, stateCode);

        const highCount = violations.filter(v => v.severity === 'high').length;
        const mediumCount = violations.filter(v => v.severity === 'medium').length;
        const lowCount = violations.filter(v => v.severity === 'low').length;

        return {
            isCompliant: violations.length === 0,
            count: violations.length,
            hasHighRisk: highCount > 0,
            highCount: highCount,
            mediumCount: mediumCount,
            lowCount: lowCount,
            violations: violations
        };
    }

    /**
     * Get all protected classes for a state
     * @param {string} stateCode - 2-letter state code
     * @returns {Array} Array of protected class identifiers
     */
    function getStateProtections(stateCode) {
        if (!stateCode) return [...federalProtectedClasses];

        const state = stateProtections[stateCode.toUpperCase()];
        if (!state) return [...federalProtectedClasses];

        return [...federalProtectedClasses, ...(state.additional || [])];
    }

    /**
     * Get state information
     * @param {string} stateCode - 2-letter state code
     * @returns {Object} State information object
     */
    function getStateInfo(stateCode) {
        if (!stateCode) return null;
        return stateProtections[stateCode.toUpperCase()] || null;
    }

    /**
     * Get all states
     * @returns {Object} Object with all states
     */
    function getAllStates() {
        return { ...stateProtections };
    }

    // ============================================
    // RENDERING FUNCTIONS
    // ============================================

    /**
     * Render scan results into a container
     * @param {Array} violations - Array of violations from scan()
     * @param {string} containerId - ID of container element
     * @param {string|null} stateCode - Optional state code for context
     */
    function renderResults(violations, containerId, stateCode = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('FairHousingScanner: Container not found:', containerId);
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Get state info
        const stateInfo = stateCode ? getStateInfo(stateCode) : null;
        const stateName = stateInfo ? stateInfo.name : 'Federal';

        if (violations.length === 0) {
            // Compliant
            container.innerHTML = `
                <div class="fhs-alert fhs-compliant">
                    <span class="fhs-icon">✓</span>
                    <div class="fhs-content">
                        <strong>Fair Housing Compliant</strong>
                        <p>No potential violations detected for ${stateName} protections.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Count by severity
        const highCount = violations.filter(v => v.severity === 'high').length;
        const mediumCount = violations.filter(v => v.severity === 'medium').length;
        const lowCount = violations.filter(v => v.severity === 'low').length;

        // Build header
        let headerClass = 'fhs-warning';
        let headerIcon = '⚠';
        let headerText = 'Potential Fair Housing Issues Found';

        if (highCount > 0) {
            headerClass = 'fhs-danger';
            headerIcon = '⛔';
            headerText = `${highCount} High-Risk Violation${highCount > 1 ? 's' : ''} Detected`;
        }

        let html = `
            <div class="fhs-alert ${headerClass}">
                <span class="fhs-icon">${headerIcon}</span>
                <div class="fhs-content">
                    <strong>${headerText}</strong>
                    <p class="fhs-summary">
                        ${stateName} scan:
                        <span class="fhs-badge fhs-high">${highCount} high</span>
                        <span class="fhs-badge fhs-medium">${mediumCount} medium</span>
                        <span class="fhs-badge fhs-low">${lowCount} low</span>
                    </p>
                </div>
            </div>
            <div class="fhs-violations-list">
        `;

        // Render each violation
        for (const v of violations) {
            html += `
                <div class="fhs-violation fhs-severity-${v.severity}">
                    <div class="fhs-violation-header">
                        <span class="fhs-severity-badge fhs-${v.severity}">${v.severity.toUpperCase()}</span>
                        <span class="fhs-category">${v.categoryName}</span>
                        <span class="fhs-law">${v.law}</span>
                    </div>
                    <div class="fhs-violation-phrase">"${escapeHtml(v.phrase)}"</div>
                    <div class="fhs-violation-suggestion">
                        <strong>Suggestion:</strong> ${escapeHtml(v.suggestion)}
                    </div>
                </div>
            `;
        }

        html += '</div>';

        // Add styles if not already present
        if (!document.getElementById('fhs-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'fhs-styles';
            styleEl.textContent = getFairHousingStyles();
            document.head.appendChild(styleEl);
        }

        container.innerHTML = html;
    }

    /**
     * Render state dropdown into a container
     * @param {string} containerId - ID of container element
     * @param {function|null} onChange - Optional callback when state changes
     */
    function renderStateDropdown(containerId, onChange = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('FairHousingScanner: Container not found:', containerId);
            return;
        }

        let html = `
            <div class="fhs-state-selector">
                <label for="fhsStateSelect" class="fhs-label">State for Compliance Check</label>
                <select id="fhsStateSelect" class="fhs-select">
                    <option value="">Federal Only (All States)</option>
        `;

        // Sort states alphabetically
        const sortedStates = Object.entries(stateProtections)
            .sort((a, b) => a[1].name.localeCompare(b[1].name));

        for (const [code, info] of sortedStates) {
            const extra = info.additional.length > 0 ? ` (+${info.additional.length} protections)` : '';
            html += `<option value="${code}">${info.name}${extra}</option>`;
        }

        html += `
                </select>
                <div id="fhsStateInfo" class="fhs-state-info"></div>
            </div>
        `;

        // Add styles if not already present
        if (!document.getElementById('fhs-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'fhs-styles';
            styleEl.textContent = getFairHousingStyles();
            document.head.appendChild(styleEl);
        }

        container.innerHTML = html;

        // Add change handler
        const select = document.getElementById('fhsStateSelect');
        if (select) {
            select.addEventListener('change', function() {
                updateStateInfo(this.value);
                if (onChange) onChange(this.value);
            });
        }
    }

    /**
     * Update state info display
     */
    function updateStateInfo(stateCode) {
        const infoEl = document.getElementById('fhsStateInfo');
        if (!infoEl) return;

        if (!stateCode) {
            infoEl.innerHTML = `
                <div class="fhs-protections">
                    <strong>Federal Protected Classes (FHA §3604):</strong>
                    <div class="fhs-protection-tags">
                        ${federalProtectedClasses.map(p =>
                            `<span class="fhs-protection-tag fhs-federal">${protectionNames[p]}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
            return;
        }

        const state = stateProtections[stateCode.toUpperCase()];
        if (!state) {
            infoEl.innerHTML = '<p>State not found.</p>';
            return;
        }

        const allProtections = getStateProtections(stateCode);

        let lawsHtml = '';
        if (state.laws && state.laws.length > 0) {
            lawsHtml = `
                <div class="fhs-laws">
                    <strong>Applicable Laws:</strong> ${state.laws.join(', ')}
                </div>
            `;
        }

        infoEl.innerHTML = `
            <div class="fhs-protections">
                <strong>Protected Classes in ${state.name}:</strong>
                <div class="fhs-protection-tags">
                    ${allProtections.map(p => {
                        const isFederal = federalProtectedClasses.includes(p);
                        const tagClass = isFederal ? 'fhs-federal' : 'fhs-state';
                        return `<span class="fhs-protection-tag ${tagClass}">${protectionNames[p] || p}</span>`;
                    }).join('')}
                </div>
                ${lawsHtml}
            </div>
        `;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Escape HTML entities
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get CSS styles for Fair Housing Scanner
     */
    function getFairHousingStyles() {
        return `
            .fhs-alert {
                display: flex;
                align-items: flex-start;
                padding: 1rem;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                gap: 0.75rem;
            }
            .fhs-alert.fhs-compliant {
                background: #DCFCE7;
                border: 1px solid #86EFAC;
                color: #166534;
            }
            .fhs-alert.fhs-warning {
                background: #FEF3C7;
                border: 1px solid #FCD34D;
                color: #92400E;
            }
            .fhs-alert.fhs-danger {
                background: #FEE2E2;
                border: 1px solid #FCA5A5;
                color: #DC2626;
            }
            .fhs-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            .fhs-content {
                flex: 1;
            }
            .fhs-content strong {
                display: block;
                font-size: 1rem;
                margin-bottom: 0.25rem;
            }
            .fhs-content p {
                margin: 0;
                font-size: 0.875rem;
            }
            .fhs-summary {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                align-items: center;
            }
            .fhs-badge {
                display: inline-block;
                padding: 0.125rem 0.5rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            .fhs-badge.fhs-high { background: #FEE2E2; color: #DC2626; }
            .fhs-badge.fhs-medium { background: #FEF3C7; color: #D97706; }
            .fhs-badge.fhs-low { background: #E5E7EB; color: #6B7280; }

            .fhs-violations-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .fhs-violation {
                background: white;
                border-radius: 0.5rem;
                padding: 1rem;
                border-left: 4px solid;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .fhs-violation.fhs-severity-high { border-left-color: #DC2626; }
            .fhs-violation.fhs-severity-medium { border-left-color: #D97706; }
            .fhs-violation.fhs-severity-low { border-left-color: #9CA3AF; }

            .fhs-violation-header {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
                margin-bottom: 0.5rem;
            }
            .fhs-severity-badge {
                padding: 0.125rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.65rem;
                font-weight: 700;
                letter-spacing: 0.05em;
            }
            .fhs-severity-badge.fhs-high { background: #DC2626; color: white; }
            .fhs-severity-badge.fhs-medium { background: #D97706; color: white; }
            .fhs-severity-badge.fhs-low { background: #9CA3AF; color: white; }

            .fhs-category {
                font-weight: 600;
                color: #1E3A5F;
            }
            .fhs-law {
                font-size: 0.75rem;
                color: #6B7280;
                margin-left: auto;
            }
            .fhs-violation-phrase {
                background: #FEF3C7;
                padding: 0.5rem 0.75rem;
                border-radius: 0.25rem;
                font-family: monospace;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
                word-break: break-word;
            }
            .fhs-violation-suggestion {
                font-size: 0.85rem;
                color: #4B5563;
            }

            .fhs-state-selector {
                margin-bottom: 1rem;
            }
            .fhs-label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #374151;
                font-size: 0.875rem;
            }
            .fhs-select {
                width: 100%;
                padding: 0.625rem 1rem;
                border: 2px solid #E5E1DB;
                border-radius: 0.5rem;
                font-size: 1rem;
                background: white;
                cursor: pointer;
            }
            .fhs-select:focus {
                outline: none;
                border-color: #D4AF37;
                box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
            }

            .fhs-state-info {
                margin-top: 0.75rem;
            }
            .fhs-protections {
                background: #F7F3ED;
                padding: 1rem;
                border-radius: 0.5rem;
                font-size: 0.875rem;
            }
            .fhs-protection-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.375rem;
                margin-top: 0.5rem;
            }
            .fhs-protection-tag {
                display: inline-block;
                padding: 0.25rem 0.625rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
            }
            .fhs-protection-tag.fhs-federal {
                background: #1E3A5F;
                color: white;
            }
            .fhs-protection-tag.fhs-state {
                background: #D4AF37;
                color: white;
            }
            .fhs-laws {
                margin-top: 0.75rem;
                font-size: 0.8rem;
                color: #6B7280;
            }

            /* Copy Report Button */
            .fhs-copy-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: #1E3A5F;
                color: white;
                border: none;
                border-radius: 0.375rem;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 1rem;
            }
            .fhs-copy-btn:hover {
                background: #0F2238;
            }
            .fhs-copy-btn.fhs-copied {
                background: #166534;
            }
        `;
    }

    /**
     * Generate a text-based compliance report
     * @param {Array} violations - Array of violations
     * @param {string|null} stateCode - Optional state code
     * @returns {string} Formatted report text
     */
    function generateReport(violations, stateCode = null) {
        const stateInfo = stateCode ? getStateInfo(stateCode) : null;
        const stateName = stateInfo ? stateInfo.name : 'Federal';
        const date = new Date().toLocaleDateString();

        let report = `FAIR HOUSING COMPLIANCE REPORT
Generated: ${date}
Jurisdiction: ${stateName}
================================

`;

        if (violations.length === 0) {
            report += `STATUS: COMPLIANT ✓

No potential Fair Housing violations were detected.

The scanned text appears to comply with Fair Housing Act requirements
for the selected jurisdiction.
`;
            return report;
        }

        const highCount = violations.filter(v => v.severity === 'high').length;
        const mediumCount = violations.filter(v => v.severity === 'medium').length;
        const lowCount = violations.filter(v => v.severity === 'low').length;

        report += `STATUS: ${highCount > 0 ? 'HIGH RISK ⚠' : 'REVIEW RECOMMENDED'}

Summary:
- High Risk: ${highCount}
- Medium Risk: ${mediumCount}
- Low Risk: ${lowCount}
- Total Issues: ${violations.length}

DETAILED FINDINGS
-----------------

`;

        violations.forEach((v, i) => {
            report += `${i + 1}. [${v.severity.toUpperCase()}] ${v.categoryName}
   Phrase: "${v.phrase}"
   Law: ${v.law}
   Suggestion: ${v.suggestion}

`;
        });

        report += `
================================
DISCLAIMER: This report is generated by automated pattern matching
and should not be considered legal advice. Consult with a licensed
attorney for definitive Fair Housing compliance guidance.
`;

        return report;
    }

    // ============================================
    // PUBLIC API
    // ============================================
    const FairHousingScanner = {
        scan: scan,
        quickScan: quickScan,
        renderResults: renderResults,
        renderStateDropdown: renderStateDropdown,
        getStateProtections: getStateProtections,
        getStateInfo: getStateInfo,
        getAllStates: getAllStates,
        generateReport: generateReport,
        federalProtectedClasses: federalProtectedClasses,
        protectionNames: protectionNames
    };

    // Export for different module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FairHousingScanner;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return FairHousingScanner; });
    } else {
        global.FairHousingScanner = FairHousingScanner;
    }

})(typeof window !== 'undefined' ? window : this);
