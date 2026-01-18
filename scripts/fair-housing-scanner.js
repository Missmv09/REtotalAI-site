// ============================================
// REtotalAI FAIR HOUSING COMPLIANCE SCANNER
// Enhanced Core Module - Use Across All Tools
// ============================================
//
// USAGE:
// 1. Include this script in any page
// 2. Call: FairHousingScanner.scan(text, stateCode)
// 3. Display: FairHousingScanner.renderResults(violations, containerId, stateCode)
// 4. Export: FairHousingScanner.exportResults(violations, format) // 'csv', 'json', 'text'
// 5. Auto-fix: FairHousingScanner.autoFix(text, stateCode)
//
// ============================================

const FairHousingScanner = (function() {

    // ============================================
    // FEDERAL VIOLATIONS (All 50 States)
    // ============================================
    const federalViolations = [
        // RACE, COLOR, NATIONAL ORIGIN
        { pattern: /\b(black|white|asian|hispanic|latino|latina|latinx|african|chinese|mexican|indian|arab|jewish|caucasian|native american|pacific islander|filipino|korean|japanese|vietnamese|middle eastern|european)\s*(people|families|neighbors|community|neighborhood|area|tenants?|residents?|buyers?)/gi, type: 'Race/National Origin', suggestion: 'Remove all racial/ethnic references - illegal under Fair Housing Act', replacement: '$2', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(lots of|many|mostly|predominantly|all|no|few|some)\s*(black|white|asian|hispanic|latino|african|mexican|indian|arab|minority|minorities|ethnic)\b/gi, type: 'Race/National Origin', suggestion: 'Remove racial demographic statements - illegal', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(diverse|diversity|ethnic|ethnically|integrated|segregated|changing|transitioning|gentrifying|urban|inner.city)\s*(neighborhood|community|area|location)/gi, type: 'Race (Coded Language)', suggestion: 'Remove demographic characterizations', replacement: 'vibrant $2', severity: 'medium', law: 'FHA §3604' },
        { pattern: /\b(speaks?\s+english|english\s+speakers?|must\s+speak\s+english|english\s+only|english\s+required)/gi, type: 'National Origin', suggestion: 'Remove language requirements - may indicate national origin discrimination', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(foreign|immigrant|migrant|undocumented|illegal\s+alien)\s*(tenants?|residents?|neighbors?|people)/gi, type: 'National Origin', suggestion: 'Remove immigration-related references', replacement: '$2', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(american\s+dream|all.american|true\s+american)\s*(neighborhood|community|family)/gi, type: 'National Origin (Coded)', suggestion: 'May imply preference for certain national origins', replacement: 'wonderful $2', severity: 'medium', law: 'FHA §3604' },

        // RELIGION
        { pattern: /\b(christian|muslim|islamic|jewish|catholic|protestant|buddhist|hindu|sikh|atheist|agnostic|religious|church-going|god.?fearing|devout)\s*(community|neighborhood|families|preferred|only|tenants?|welcome)/gi, type: 'Religion', suggestion: 'Remove religious references', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(near|close to|walking distance to|minutes from|next to|across from)\s*(church|mosque|synagogue|temple|cathedral|parish|chapel|monastery|ashram|gurdwara)/gi, type: 'Religion', suggestion: 'Remove proximity to religious institutions or use "places of worship"', replacement: 'near community amenities', severity: 'low', law: 'FHA §3604' },
        { pattern: /\b(faith.?based|christian values|kosher|halal|sabbath|sunday|shabbat)\s*(community|living|lifestyle|friendly)/gi, type: 'Religion', suggestion: 'Remove religious characterizations', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(christmas|easter|hanukkah|ramadan|diwali)\s*(community|neighborhood|celebration|spirit)/gi, type: 'Religion (Coded)', suggestion: 'May imply religious preferences', replacement: 'festive $2', severity: 'low', law: 'FHA §3604' },

        // FAMILIAL STATUS
        { pattern: /\b(perfect for|ideal for|great for|best for|suited for|designed for|meant for|intended for)\s*(families|singles|couples|retirees|adults|children|kids|seniors|young professionals|empty nesters|newlyweds|bachelors?|bachelorettes?)/gi, type: 'Familial Status', suggestion: 'Remove target demographic language - describe the property features instead', replacement: 'features include space for', severity: 'medium', law: 'FHA §3604' },
        { pattern: /\b(no|without|not allowed|prohibited|restricted|cannot have|don\'t allow)\s*(children|kids|families|babies|infants|minors|toddlers|teenagers|teens)/gi, type: 'Familial Status', suggestion: 'Remove restrictions on families - illegal', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(adults?\s*only|no\s*kids|child.?free|kidless|over\s*18\s*only|18\+\s*only|grown.?ups?\s*only|mature\s*adults?\s*only)/gi, type: 'Familial Status', suggestion: 'Cannot exclude families with children (except qualified 55+ housing)', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(mother.?in.?law|nanny|au pair|maid\'?s?|servant\'?s?)\s*(suite|quarters|room|apartment|unit)/gi, type: 'Familial Status', suggestion: 'Use "guest suite" or "additional living space"', replacement: 'guest $2', severity: 'low', law: 'FHA §3604' },
        { pattern: /\b(nursery|children\'?s?\s*room|playroom|kid\'?s?\s*room|baby\'?s?\s*room)/gi, type: 'Familial Status', suggestion: 'Use "bonus room" or "flexible space" instead', replacement: 'bonus room', severity: 'low', law: 'FHA §3604' },
        { pattern: /\b(quiet\s*(building|community|neighborhood|complex)|no\s*noise|peaceful\s*adult)/gi, type: 'Familial Status (Coded)', suggestion: 'May imply exclusion of families with children', replacement: 'peaceful setting', severity: 'medium', law: 'FHA §3604' },
        { pattern: /\b(senior\s*(living|community|housing|complex)|retirement\s*(community|living)|55\s*and\s*(over|older)|62\s*and\s*(over|older)|active\s*adult)/gi, type: 'Familial Status', suggestion: 'Only valid for qualified senior housing (HOPA compliant)', replacement: '[VERIFY 55+ COMPLIANCE]', severity: 'medium', law: 'FHA §3604 / HOPA' },

        // SEX / GENDER
        { pattern: /\b(man\s*cave|bachelor\s*pad|bachelorette|his\s+and\s+hers|guy\'?s?\s*retreat|she\s*shed|lady\'?s?\s*room)/gi, type: 'Sex/Gender', suggestion: 'Use gender-neutral terms', replacement: 'bonus room', severity: 'low', law: 'FHA §3604' },
        { pattern: /\b(master\s+bedroom|master\s+suite|master\s+bath|master\s+closet)/gi, type: 'Sex/Gender', suggestion: 'Use "primary bedroom" or "owner\'s suite" instead', replacement: 'primary $1'.replace('master ', ''), severity: 'low', law: 'Industry Best Practice' },
        { pattern: /\b(female|male|women|men|woman|man)\s*(only|preferred|tenants?|roommates?|buyers?|renters?|occupants?)/gi, type: 'Sex/Gender', suggestion: 'Cannot specify gender preferences', replacement: '$2', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(sorority|fraternity|girls\'?\s*house|boys\'?\s*house|women\'?s?\s*housing|men\'?s?\s*housing)/gi, type: 'Sex/Gender', suggestion: 'Cannot specify gender-based housing (except certain exemptions)', replacement: 'shared housing', severity: 'high', law: 'FHA §3604' },

        // SEXUAL ORIENTATION & GENDER IDENTITY (HUD 2021 + Bostock)
        { pattern: /\b(gay|lesbian|lgbtq\+?|lgbt\+?|transgender|trans|bisexual|straight|heterosexual|homosexual|queer|non.?binary|gender.?fluid)\s*(friendly|welcome|community|neighborhood|area|couples?|families|tenants?|only)/gi, type: 'Sexual Orientation/Gender Identity', suggestion: 'Remove references to sexual orientation or gender identity', replacement: 'welcoming $2', severity: 'medium', law: 'FHA via Bostock/HUD 2021' },
        { pattern: /\b(same.?sex|opposite.?sex)\s*(couples?|partners?|marriage|relationships?)/gi, type: 'Sexual Orientation', suggestion: 'Remove references to relationship types', replacement: 'couples', severity: 'medium', law: 'FHA via Bostock/HUD 2021' },
        { pattern: /\b(pride|rainbow)\s*(neighborhood|community|district|friendly|flag)/gi, type: 'Sexual Orientation (Coded)', suggestion: 'Avoid coded references', replacement: 'welcoming $2', severity: 'low', law: 'FHA via Bostock/HUD 2021' },
        { pattern: /\b(traditional\s*(family|values|marriage|lifestyle|couples?|household))/gi, type: 'Sexual Orientation (Coded)', suggestion: 'May imply exclusion of LGBTQ+ individuals', replacement: 'family', severity: 'medium', law: 'FHA via Bostock/HUD 2021' },
        { pattern: /\b(normal\s*(family|couple|relationship|lifestyle)|natural\s*family)/gi, type: 'Sexual Orientation (Coded)', suggestion: 'Implies certain family structures are abnormal', replacement: 'family', severity: 'medium', law: 'FHA via Bostock/HUD 2021' },

        // DISABILITY
        { pattern: /\b(handicapped?|crippled?|wheelchair.?bound|confined to wheelchair|mentally ill|crazy|insane|retarded|slow|special needs|deformed|invalid|lame|dumb|deaf and dumb|suffers from|afflicted|victim of)/gi, type: 'Disability', suggestion: 'Use "accessible" or person-first language (e.g., "person with a disability")', replacement: 'accessible', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(no|without|not for|cannot accommodate|unable to accommodate|don\'t accept)\s*(wheelchairs?|disabled|handicapped|service\s*animals?|emotional\s*support|esa|assistance\s*animals?|guide\s*dogs?|mobility\s*aids?)/gi, type: 'Disability', suggestion: 'Cannot exclude based on disability - illegal. Must make reasonable accommodations.', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(able.?bodied|physically\s*fit|healthy|in good health|strong|athletic)\s*(only|preferred|required|tenants?|applicants?)/gi, type: 'Disability', suggestion: 'Cannot require physical ability', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(no\s*mental|mental\s*illness|psychiatric|psychological)\s*(issues?|problems?|history|conditions?|disorders?)/gi, type: 'Disability', suggestion: 'Cannot discriminate based on mental health', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(no\s*(pets|animals)|pets?\s*not\s*allowed)/gi, type: 'Disability (Service Animals)', suggestion: 'Must allow service animals and emotional support animals with proper documentation', replacement: 'pet policy applies (service animals welcome)', severity: 'medium', law: 'FHA §3604' },
        { pattern: /\b(stairs\s*only|no\s*elevator|must\s*climb|walk.?up\s*only|upper\s*floor\s*only)/gi, type: 'Disability (Accessibility)', suggestion: 'Describe accessibility features neutrally', replacement: 'upper level unit', severity: 'low', law: 'FHA §3604' },
        { pattern: /\b(drug\s*free|substance\s*free|sober\s*living|no\s*addicts?|no\s*alcoholics?)/gi, type: 'Disability', suggestion: 'Recovering addicts are protected under disability provisions', replacement: '', severity: 'medium', law: 'FHA §3604' },

        // STEERING / CODED LANGUAGE
        { pattern: /\b(good|safe|bad|dangerous|sketchy|rough|up.and.coming|improving|declining|transitional|troubled|high.?crime|low.?crime)\s*(neighborhood|area|community|schools?|part of town|block|street|district)/gi, type: 'Potential Steering', suggestion: 'Avoid subjective safety/quality characterizations - may constitute steering', replacement: '$2', severity: 'medium', law: 'FHA §3604' },
        { pattern: /\b(exclusive|prestigious|elite|upscale|refined|established|old\s*money|blue\s*blood|well.?bred|upper\s*class|high\s*class)\s*(neighborhood|community|area|enclave|district)/gi, type: 'Potential Steering', suggestion: 'May imply discriminatory preferences', replacement: 'desirable $2', severity: 'low', law: 'FHA §3604' },
        { pattern: /\b(undesirable|desirable|right kind of|quality|better class of|respectable|suitable)\s*(neighbors?|tenants?|people|element|buyers?|residents?|clientele)/gi, type: 'Steering', suggestion: 'Remove subjective characterizations', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(keep out|not welcome|stay away|wrong crowd|those people|you people|your kind|their kind|certain types?)/gi, type: 'Steering', suggestion: 'Remove exclusionary language', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(white\s*flight|block.?busting|red.?lining|restrictive\s*covenant)/gi, type: 'Steering (Historical)', suggestion: 'References to discriminatory practices', replacement: '', severity: 'high', law: 'FHA §3604' },
        { pattern: /\b(you\'ll\s*fit\s*in|you\'ll\s*be\s*comfortable|your\s*type|people\s*like\s*you|you\'ll\s*love\s*it\s*here)/gi, type: 'Steering (Subtle)', suggestion: 'May constitute steering based on protected class', replacement: 'this property offers', severity: 'medium', law: 'FHA §3604' },

        // CRIMINAL HISTORY (HUD 2016 Guidance)
        { pattern: /\b(no\s*(felons?|criminals?|convicts?|ex.?cons?)|felons?\s*need\s*not\s*apply|clean\s*record\s*required|no\s*criminal\s*(history|record|background))/gi, type: 'Criminal History (Disparate Impact)', suggestion: 'Blanket criminal bans may have disparate impact on protected classes - use individualized assessment', replacement: 'background check required', severity: 'medium', law: 'HUD 2016 Guidance' },

        // HARASSMENT / HOSTILE ENVIRONMENT
        { pattern: /\b(will\s*be\s*watched|under\s*surveillance|we\'re\s*watching|keep\s*an\s*eye\s*on|monitor\s*closely)/gi, type: 'Harassment', suggestion: 'May create hostile environment for protected classes', replacement: 'secure community', severity: 'medium', law: 'FHA §3604' },
    ];

    // ============================================
    // STATE PROTECTION MAPPINGS
    // ============================================
    const stateProtections = {
        sourceOfIncome: ['CA', 'CO', 'CT', 'DE', 'DC', 'HI', 'IL', 'MA', 'MD', 'ME', 'MN', 'NJ', 'NY', 'ND', 'OK', 'OR', 'UT', 'VT', 'WA', 'WI'],
        maritalStatus: ['AK', 'CA', 'CO', 'CT', 'DE', 'DC', 'HI', 'IL', 'MA', 'MD', 'ME', 'MI', 'MN', 'MT', 'NH', 'NJ', 'NY', 'ND', 'OR', 'RI', 'VT', 'WA', 'WI'],
        military: ['CA', 'CT', 'DC', 'FL', 'IL', 'IN', 'KY', 'ME', 'MN', 'MT', 'NJ', 'NM', 'NY', 'OH', 'OK', 'OR', 'SC', 'TX', 'UT', 'WI'],
        age: ['CA', 'CT', 'DC', 'HI', 'IL', 'MA', 'MD', 'ME', 'MI', 'MN', 'MT', 'NJ', 'NY', 'OR', 'RI', 'VT', 'WA'],
        ancestry: ['CA', 'CT', 'DC', 'HI', 'IL', 'MD', 'MN', 'NJ', 'NY', 'OR', 'PA', 'RI', 'VT', 'WA'],
        sexualOrientation: ['CA', 'CO', 'CT', 'DC', 'DE', 'HI', 'IL', 'IA', 'MA', 'MD', 'ME', 'MN', 'NV', 'NH', 'NJ', 'NM', 'NY', 'OR', 'PA', 'RI', 'UT', 'VT', 'WA', 'WI'],
        genderIdentity: ['CA', 'CO', 'CT', 'DC', 'DE', 'HI', 'IL', 'IA', 'MA', 'MD', 'ME', 'MN', 'NV', 'NH', 'NJ', 'NM', 'NY', 'OR', 'RI', 'UT', 'VT', 'WA'],
        domesticViolence: ['CA', 'CT', 'DC', 'IL', 'IN', 'MA', 'NJ', 'NY', 'NC', 'OR', 'RI', 'WA'],
        immigration: ['CA', 'DC', 'NY', 'IL'],
        genetic: ['CA', 'CT', 'IL', 'MA', 'NJ', 'NY', 'VT', 'WI'],
        student: ['DC', 'NJ', 'NY'],
        occupation: ['DC', 'NY', 'WI'],
        primaryLanguage: ['CA'],
        medicalCondition: ['CA'],
        arbitrary: ['CA'], // Unruh Act
        politicalAffiliation: ['DC', 'CA', 'PR'],
        publicAssistance: ['MN', 'ND', 'WI'],
        parentalStatus: ['AK', 'DC'],
        personalAppearance: ['DC'],
        matriculation: ['DC'],
        victimOfCrime: ['IL', 'WA'],
    };

    // ============================================
    // STATE-SPECIFIC VIOLATIONS
    // ============================================
    const stateViolations = {
        sourceOfIncome: [
            { pattern: /\b(no\s*section\s*8|section\s*8\s*not\s*accepted|no\s*vouchers?|no\s*housing\s*(assistance|choice)|no\s*hcv|vouchers?\s*not\s*accepted|no\s*subsidized?|no\s*government\s*(assistance|aid|programs?)|hud\s*not\s*accepted)/gi, type: 'Source of Income', suggestion: 'Cannot refuse Section 8 or housing vouchers in this state', replacement: 'housing vouchers welcome', severity: 'high' },
            { pattern: /\b(must\s*earn\s*\d+\s*x|income\s*must\s*be\s*\d+\s*x|income\s*requirements?\s*\d+x|\d+x\s*rent\s*required|minimum\s*income\s*\d+)/gi, type: 'Source of Income', suggestion: 'Income requirements may discriminate against voucher holders - consider total income including voucher', replacement: 'income verification required', severity: 'medium' },
            { pattern: /\b(no\s*ssi|no\s*ssdi|no\s*social\s*security|no\s*disability\s*income|no\s*retirement\s*income|no\s*pension|no\s*alimony|no\s*child\s*support|no\s*welfare|no\s*benefits?)/gi, type: 'Source of Income', suggestion: 'Cannot exclude based on lawful income source', replacement: '', severity: 'high' },
            { pattern: /\b(employed\s*only|must\s*be\s*employed|w-?2\s*(income\s*)?required|pay\s*stubs?\s*only|current\s*job\s*required|employment\s*required|must\s*have\s*(a\s*)?job)/gi, type: 'Source of Income', suggestion: 'Cannot require employment as sole income source', replacement: 'proof of income required', severity: 'medium' },
            { pattern: /\b(traditional\s*income|conventional\s*income|earned\s*income\s*only|work\s*income\s*only)/gi, type: 'Source of Income', suggestion: 'Cannot discriminate based on type of lawful income', replacement: 'verifiable income', severity: 'medium' },
        ],

        maritalStatus: [
            { pattern: /\b(married|single|divorced|widowed|unmarried|separated)\s*(only|preferred|couples?|individuals?|people|tenants?|applicants?)/gi, type: 'Marital Status', suggestion: 'Cannot specify marital status preferences in this state', replacement: '', severity: 'high' },
            { pattern: /\b(no\s*roommates?|couples?\s*only|single\s*occupant\s*only|one\s*person\s*only|cohabitating\s*couples?\s*only|no\s*cohabitation)/gi, type: 'Marital Status', suggestion: 'May discriminate based on marital/relationship status', replacement: '', severity: 'medium' },
            { pattern: /\b(domestic\s*partner|life\s*partner|significant\s*other|unmarried\s*couple|living\s*together)\s*(not\s*allowed|prohibited|no|banned)/gi, type: 'Marital Status', suggestion: 'Cannot exclude domestic partnerships', replacement: '', severity: 'high' },
            { pattern: /\b(husband\s*and\s*wife|man\s*and\s*wife|legally\s*married|marriage\s*certificate)\s*(only|required|must\s*be)/gi, type: 'Marital Status', suggestion: 'Cannot require legal marriage', replacement: '', severity: 'high' },
            { pattern: /\b(family\s*values|wholesome|moral\s*character|upstanding)\s*(required|only|tenants?|applicants?)/gi, type: 'Marital Status (Coded)', suggestion: 'May imply marital status discrimination', replacement: '', severity: 'medium' },
        ],

        military: [
            { pattern: /\b(no\s*military|civilians?\s*only|no\s*service\s*members?|no\s*veterans?|no\s*active\s*duty|no\s*armed\s*forces|no\s*army|no\s*navy|no\s*marines?|no\s*air\s*force)/gi, type: 'Military/Veteran Status', suggestion: 'Cannot discriminate against military/veterans in this state', replacement: '', severity: 'high' },
            { pattern: /\b(military\s*not\s*welcome|no\s*deployments?|no\s*(frequent\s*)?transfers?|stable\s*employment\s*only|long.?term\s*tenants?\s*only|no\s*short.?term|minimum\s*\d+\s*year\s*lease)/gi, type: 'Military/Veteran Status', suggestion: 'May discriminate against military members who transfer frequently', replacement: '', severity: 'medium' },
            { pattern: /\b(no\s*gi\s*bill|no\s*va\s*(loan|financing|mortgage)|va\s*not\s*accepted)/gi, type: 'Military/Veteran Status', suggestion: 'Cannot refuse VA financing in this state', replacement: 'VA loans welcome', severity: 'high' },
        ],

        age: [
            { pattern: /\b(young\s*(professionals?|people|tenants?|adults?|couples?)|millennials?\s*only|gen.?z\s*only|under\s*\d+\s*only|recent\s*grads?\s*only)/gi, type: 'Age', suggestion: 'Cannot specify age preferences in this state', replacement: '', severity: 'medium' },
            { pattern: /\b(mature|elderly|seniors?\s*only|retirees?\s*only|older\s*(adults?|tenants?|people)|golden\s*years)/gi, type: 'Age', suggestion: 'Age is protected (except qualified 55+ housing)', replacement: '', severity: 'medium' },
            { pattern: /\b(no\s*college\s*students?|students?\s*not\s*allowed|no\s*young\s*people|no\s*recent\s*grads?|no\s*millennials?|no\s*kids|no\s*youth)/gi, type: 'Age', suggestion: 'May constitute age discrimination', replacement: '', severity: 'high' },
            { pattern: /\b(must\s*be\s*(over|under|at\s*least|no\s*more\s*than)\s*\d+|age\s*\d+\s*(and\s*(over|older)|\+|or\s*(older|younger))|between\s*\d+\s*and\s*\d+\s*years?\s*old)/gi, type: 'Age', suggestion: 'Cannot set age requirements (except qualified senior housing)', replacement: '', severity: 'high' },
            { pattern: /\b(youthful|vibrant\s*young|energetic\s*young)\s*(community|neighborhood|tenants?)/gi, type: 'Age (Coded)', suggestion: 'May imply age preference', replacement: 'vibrant $2', severity: 'low' },
        ],

        ancestry: [
            { pattern: /\b(american\s*born|native\s*born|born\s*in\s*(us|usa|america|the\s*us)|citizens?\s*only|us\s*citizens?\s*only|must\s*be\s*(a\s*)?(us\s*)?citizen|citizenship\s*required)/gi, type: 'Ancestry/Citizenship', suggestion: 'Cannot require citizenship in this state', replacement: '', severity: 'high' },
            { pattern: /\b(no\s*immigrants?|no\s*foreigners?|americans?\s*only|no\s*foreign\s*nationals?|no\s*non.?citizens?|residents?\s*only)/gi, type: 'Ancestry/Citizenship', suggestion: 'Cannot discriminate based on national origin/ancestry', replacement: '', severity: 'high' },
            { pattern: /\b(legal\s*(status|resident)\s*required|documentation\s*required|papers\s*required|visa\s*status|immigration\s*status|proof\s*of\s*(legal\s*)?(status|residency))/gi, type: 'Ancestry/Immigration', suggestion: 'May constitute ancestry/immigration discrimination', replacement: 'identification required', severity: 'medium' },
            { pattern: /\b(green\s*card|permanent\s*resident|naturalized|first\s*generation|second\s*generation|fob|fresh\s*off\s*the\s*boat)/gi, type: 'Ancestry/Immigration', suggestion: 'References to immigration status may be discriminatory', replacement: '', severity: 'medium' },
        ],

        domesticViolence: [
            { pattern: /\b(no\s*restraining\s*orders?|no\s*protection\s*orders?|no\s*domestic\s*violence|no\s*dv\s*(history|victims?|survivors?)|background\s*check\s*on\s*dv)/gi, type: 'Domestic Violence Victim Status', suggestion: 'Cannot discriminate against DV survivors in this state', replacement: '', severity: 'high' },
            { pattern: /\b(police\s*calls?\s*history|no\s*911\s*calls?|nuisance\s*(ordinance|calls?|violations?)|too\s*many\s*police\s*calls?)/gi, type: 'Domestic Violence Victim Status', suggestion: 'May discriminate against DV victims who called police', replacement: '', severity: 'medium' },
            { pattern: /\b(no\s*drama|drama.?free|peaceful\s*tenants?\s*only|no\s*trouble|trouble.?free)/gi, type: 'Domestic Violence (Coded)', suggestion: 'May discourage DV survivors from applying', replacement: '', severity: 'low' },
        ],

        student: [
            { pattern: /\b(no\s*students?|students?\s*not\s*allowed|non.?students?\s*only|no\s*college\s*(kids?|students?)|professionals?\s*only|no\s*undergrads?|no\s*graduate\s*students?)/gi, type: 'Student Status', suggestion: 'Student status is protected in this state', replacement: '', severity: 'medium' },
            { pattern: /\b(working\s*professionals?\s*only|career\s*professionals?\s*only|established\s*professionals?)/gi, type: 'Student Status (Coded)', suggestion: 'May discriminate against students', replacement: '', severity: 'low' },
        ],

        occupation: [
            { pattern: /\b(professionals?\s*only|white\s*collar\s*only|no\s*blue\s*collar|executives?\s*only|management\s*only|certain\s*professions?|career\s*professionals?)/gi, type: 'Lawful Occupation', suggestion: 'Cannot discriminate based on lawful occupation in this state', replacement: '', severity: 'medium' },
            { pattern: /\b(no\s*(bartenders?|servers?|hospitality|retail|service\s*workers?|food\s*service|restaurant|night\s*shift|gig\s*workers?|uber|lyft|delivery))/gi, type: 'Lawful Occupation', suggestion: 'Cannot exclude based on job type', replacement: '', severity: 'high' },
            { pattern: /\b(office\s*workers?\s*only|9.?to.?5\s*only|traditional\s*hours|daytime\s*workers?)/gi, type: 'Lawful Occupation', suggestion: 'May discriminate against workers with non-traditional schedules', replacement: '', severity: 'low' },
        ],

        // CALIFORNIA SPECIFIC
        primaryLanguage: [
            { pattern: /\b(english\s*(only|required|speakers?|speaking|proficiency)|must\s*speak\s*english|no\s*(spanish|chinese|vietnamese|korean|tagalog|armenian|persian)|no\s*foreign\s*languages?|language\s*requirements?|communicate\s*in\s*english)/gi, type: 'Primary Language (CA FEHA)', suggestion: 'Cannot require English proficiency in California', replacement: '', severity: 'high' },
            { pattern: /\b(interpreter\s*required|translation\s*not\s*provided|must\s*communicate\s*in\s*english|english\s*lease\s*only)/gi, type: 'Primary Language (CA FEHA)', suggestion: 'May discriminate based on primary language', replacement: '', severity: 'medium' },
        ],

        medicalCondition: [
            { pattern: /\b(no\s*(hiv|aids|cancer|medical\s*conditions?|chronic\s*illness|terminal|contagious)|health\s*screening\s*required|medical\s*(history|exam|records?)\s*required|must\s*be\s*healthy|clean\s*bill\s*of\s*health)/gi, type: 'Medical Condition (CA FEHA)', suggestion: 'Cannot discriminate based on medical condition in CA', replacement: '', severity: 'high' },
            { pattern: /\b(no\s*smokers?|non.?smokers?\s*only|smoke.?free\s*applicants?)/gi, type: 'Medical Condition (CA)', suggestion: 'Smoking status may be protected under medical condition in CA', replacement: 'smoke-free property', severity: 'low' },
        ],

        genetic: [
            { pattern: /\b(genetic\s*(testing|screening|information)\s*required|family\s*medical\s*history\s*required|hereditary\s*(conditions?|diseases?)|dna\s*test|genetic\s*predisposition)/gi, type: 'Genetic Information', suggestion: 'Cannot require genetic information', replacement: '', severity: 'high' },
        ],

        immigration: [
            { pattern: /\b(green\s*card\s*required|visa\s*(required|status|type)|immigration\s*status|citizenship\s*status|work\s*authorization|i-?9\s*verification|e-?verify|legal\s*status)/gi, type: 'Immigration Status (CA/DC/NY/IL)', suggestion: 'Cannot require immigration documentation in this state', replacement: '', severity: 'high' },
            { pattern: /\b(social\s*security\s*(number|card)\s*required|ssn\s*required|itin\s*not\s*accepted|must\s*have\s*ssn|no\s*itin)/gi, type: 'Immigration Status', suggestion: 'SSN requirement may discriminate against immigrants - accept ITIN', replacement: 'government ID required', severity: 'medium' },
            { pattern: /\b(undocumented|illegal\s*alien|illegal\s*immigrant|without\s*papers|deportation)/gi, type: 'Immigration Status', suggestion: 'Cannot inquire about or discriminate based on immigration status', replacement: '', severity: 'high' },
        ],

        arbitrary: [
            { pattern: /\b(no\s*(tattoos?|piercings?|colored\s*hair|dyed\s*hair|alternative\s*(lifestyle|appearance)|unconventional|weird|strange))/gi, type: 'Arbitrary (CA Unruh Act)', suggestion: 'Unruh Act prohibits arbitrary discrimination in CA', replacement: '', severity: 'medium' },
            { pattern: /\b(must\s*dress\s*professionally|appearance\s*standards?|grooming\s*requirements?|dress\s*code|clean\s*cut|well\s*groomed)/gi, type: 'Arbitrary (CA Unruh Act)', suggestion: 'Personal appearance requirements may violate Unruh Act', replacement: '', severity: 'low' },
            { pattern: /\b(no\s*motorcycles?|no\s*bikers?|no\s*loud\s*music|no\s*parties|no\s*guests|no\s*visitors)/gi, type: 'Arbitrary (CA Unruh)', suggestion: 'Overly broad restrictions may violate Unruh Act', replacement: '', severity: 'low' },
        ],

        politicalAffiliation: [
            { pattern: /\b(republicans?\s*only|democrats?\s*only|conservatives?\s*only|liberals?\s*only|no\s*(republicans?|democrats?|conservatives?|liberals?|trump|biden)|maga|political\s*affiliation)/gi, type: 'Political Affiliation', suggestion: 'Cannot discriminate based on political affiliation in this jurisdiction', replacement: '', severity: 'high' },
        ],

        publicAssistance: [
            { pattern: /\b(no\s*public\s*assistance|no\s*welfare|no\s*food\s*stamps|no\s*snap|no\s*tanf|no\s*wic|no\s*medicaid|no\s*government\s*benefits)/gi, type: 'Public Assistance Status', suggestion: 'Cannot discriminate against recipients of public assistance in this state', replacement: '', severity: 'high' },
        ],

        victimOfCrime: [
            { pattern: /\b(no\s*crime\s*victims?|victim\s*history|victim\s*of\s*crime\s*background)/gi, type: 'Victim of Crime Status', suggestion: 'Cannot discriminate against crime victims in this state', replacement: '', severity: 'high' },
        ],
    };

    // ============================================
    // STATE INFO & LAWS - ALL 50 STATES + DC
    // ============================================
    const stateLaws = {
        'AL': { name: 'Alabama', law: 'Alabama Fair Housing Law', agency: 'Alabama Human Relations Commission', notes: 'Federal protections only' },
        'AK': { name: 'Alaska', law: 'Alaska Human Rights Law (AS 18.80)', agency: 'Alaska State Commission for Human Rights', notes: 'Adds marital status, parenthood' },
        'AZ': { name: 'Arizona', law: 'Arizona Fair Housing Act', agency: 'Arizona Attorney General Civil Rights Division', notes: 'Federal protections' },
        'AR': { name: 'Arkansas', law: 'Arkansas Fair Housing Act', agency: 'Arkansas Fair Housing Commission', notes: 'Federal protections only' },
        'CA': { name: 'California', law: 'FEHA + Unruh Civil Rights Act', agency: 'Civil Rights Department (CRD)', notes: 'Broadest protections - includes source of income, arbitrary discrimination' },
        'CO': { name: 'Colorado', law: 'Colorado Anti-Discrimination Act (CADA)', agency: 'Colorado Civil Rights Division', notes: 'Adds sexual orientation, source of income' },
        'CT': { name: 'Connecticut', law: 'Connecticut Fair Housing Act', agency: 'Commission on Human Rights and Opportunities (CHRO)', notes: 'Comprehensive state protections' },
        'DE': { name: 'Delaware', law: 'Delaware Fair Housing Act', agency: 'Delaware Division of Human Relations', notes: 'Adds sexual orientation, source of income' },
        'DC': { name: 'Washington DC', law: 'DC Human Rights Act', agency: 'DC Office of Human Rights', notes: 'Most comprehensive - 20+ protected classes' },
        'FL': { name: 'Florida', law: 'Florida Fair Housing Act', agency: 'Florida Commission on Human Relations', notes: 'Adds military status' },
        'GA': { name: 'Georgia', law: 'Georgia Fair Housing Law', agency: 'Georgia Commission on Equal Opportunity', notes: 'Federal protections' },
        'HI': { name: 'Hawaii', law: 'Hawaii Fair Housing Law (HRS 515)', agency: 'Hawaii Civil Rights Commission', notes: 'Adds marital status, age, HIV status' },
        'ID': { name: 'Idaho', law: 'Idaho Fair Housing Act', agency: 'Idaho Human Rights Commission', notes: 'Federal protections only' },
        'IL': { name: 'Illinois', law: 'Illinois Human Rights Act', agency: 'Illinois Department of Human Rights', notes: 'Comprehensive protections including immigration status' },
        'IN': { name: 'Indiana', law: 'Indiana Fair Housing Act', agency: 'Indiana Civil Rights Commission', notes: 'Adds military status, DV victim status' },
        'IA': { name: 'Iowa', law: 'Iowa Civil Rights Act', agency: 'Iowa Civil Rights Commission', notes: 'Adds sexual orientation, gender identity' },
        'KS': { name: 'Kansas', law: 'Kansas Act Against Discrimination', agency: 'Kansas Human Rights Commission', notes: 'Federal protections' },
        'KY': { name: 'Kentucky', law: 'Kentucky Fair Housing Act', agency: 'Kentucky Commission on Human Rights', notes: 'Adds military status' },
        'LA': { name: 'Louisiana', law: 'Louisiana Fair Housing Act', agency: 'Louisiana Commission on Human Rights', notes: 'Federal protections' },
        'ME': { name: 'Maine', law: 'Maine Human Rights Act', agency: 'Maine Human Rights Commission', notes: 'Adds sexual orientation, source of income' },
        'MD': { name: 'Maryland', law: 'Maryland Fair Housing Law', agency: 'Maryland Commission on Civil Rights', notes: 'Adds marital status, sexual orientation' },
        'MA': { name: 'Massachusetts', law: 'Massachusetts Fair Housing Law (Ch. 151B)', agency: 'Massachusetts Commission Against Discrimination (MCAD)', notes: 'Adds sexual orientation, age, source of income' },
        'MI': { name: 'Michigan', law: 'Elliott-Larsen Civil Rights Act', agency: 'Michigan Department of Civil Rights', notes: 'Adds marital status, age' },
        'MN': { name: 'Minnesota', law: 'Minnesota Human Rights Act', agency: 'Minnesota Department of Human Rights', notes: 'Adds public assistance, sexual orientation' },
        'MS': { name: 'Mississippi', law: 'Federal FHA only', agency: 'HUD (no state agency)', notes: 'No state fair housing law' },
        'MO': { name: 'Missouri', law: 'Missouri Human Rights Act', agency: 'Missouri Commission on Human Rights', notes: 'Federal protections' },
        'MT': { name: 'Montana', law: 'Montana Human Rights Act', agency: 'Montana Human Rights Bureau', notes: 'Adds marital status, age' },
        'NE': { name: 'Nebraska', law: 'Nebraska Fair Housing Act', agency: 'Nebraska Equal Opportunity Commission', notes: 'Federal protections' },
        'NV': { name: 'Nevada', law: 'Nevada Fair Housing Law', agency: 'Nevada Equal Rights Commission', notes: 'Adds sexual orientation, gender identity' },
        'NH': { name: 'New Hampshire', law: 'New Hampshire Law Against Discrimination', agency: 'NH Commission for Human Rights', notes: 'Adds sexual orientation, marital status' },
        'NJ': { name: 'New Jersey', law: 'Law Against Discrimination (LAD)', agency: 'NJ Division on Civil Rights', notes: 'Comprehensive - source of income, student status' },
        'NM': { name: 'New Mexico', law: 'New Mexico Human Rights Act', agency: 'NM Human Rights Bureau', notes: 'Adds sexual orientation, gender identity' },
        'NY': { name: 'New York', law: 'NY Human Rights Law + NYC Human Rights Law', agency: 'NY Division of Human Rights', notes: 'Very comprehensive - source of income, immigration, student status' },
        'NC': { name: 'North Carolina', law: 'NC Fair Housing Act', agency: 'NC Human Relations Commission', notes: 'Adds DV victim status' },
        'ND': { name: 'North Dakota', law: 'ND Human Rights Act', agency: 'ND Department of Labor', notes: 'Adds source of income, public assistance' },
        'OH': { name: 'Ohio', law: 'Ohio Fair Housing Law', agency: 'Ohio Civil Rights Commission', notes: 'Adds military status' },
        'OK': { name: 'Oklahoma', law: 'Oklahoma Fair Housing Act', agency: 'Oklahoma Human Rights Commission', notes: 'Adds military status, source of income' },
        'OR': { name: 'Oregon', law: 'Oregon Fair Housing Law (ORS 659A)', agency: 'Bureau of Labor and Industries (BOLI)', notes: 'Adds source of income, domestic violence victim' },
        'PA': { name: 'Pennsylvania', law: 'Pennsylvania Human Relations Act', agency: 'PA Human Relations Commission', notes: 'Adds ancestry, sexual orientation in some cities' },
        'RI': { name: 'Rhode Island', law: 'RI Fair Housing Practices Act', agency: 'RI Commission for Human Rights', notes: 'Adds age, marital status, sexual orientation' },
        'SC': { name: 'South Carolina', law: 'SC Fair Housing Law', agency: 'SC Human Affairs Commission', notes: 'Adds military status' },
        'SD': { name: 'South Dakota', law: 'SD Human Relations Act', agency: 'SD Division of Human Rights', notes: 'Federal protections' },
        'TN': { name: 'Tennessee', law: 'Tennessee Fair Housing Act', agency: 'Tennessee Human Rights Commission', notes: 'Federal protections' },
        'TX': { name: 'Texas', law: 'Texas Fair Housing Act', agency: 'Texas Workforce Commission Civil Rights Division', notes: 'Adds military status' },
        'UT': { name: 'Utah', law: 'Utah Fair Housing Act', agency: 'Utah Labor Commission Antidiscrimination Division', notes: 'Adds source of income, sexual orientation' },
        'VT': { name: 'Vermont', law: 'Vermont Fair Housing Law', agency: 'Vermont Human Rights Commission', notes: 'Adds sexual orientation, source of income' },
        'VA': { name: 'Virginia', law: 'Virginia Fair Housing Law', agency: 'Virginia Fair Housing Office', notes: 'Adds elderliness, source of funds (local)' },
        'WA': { name: 'Washington', law: 'Washington Law Against Discrimination (WLAD)', agency: 'Washington State Human Rights Commission', notes: 'Comprehensive - adds many classes' },
        'WV': { name: 'West Virginia', law: 'WV Fair Housing Act', agency: 'WV Human Rights Commission', notes: 'Federal protections' },
        'WI': { name: 'Wisconsin', law: 'Wisconsin Fair Housing Law', agency: 'Wisconsin Equal Rights Division', notes: 'Adds marital status, source of income, sexual orientation' },
        'WY': { name: 'Wyoming', law: 'Wyoming Fair Housing Act', agency: 'Wyoming Department of Workforce Services', notes: 'Federal protections only' },
        'PR': { name: 'Puerto Rico', law: 'Puerto Rico Civil Rights Act', agency: 'PR Civil Rights Commission', notes: 'Adds political affiliation' },
        'GU': { name: 'Guam', law: 'Guam Fair Housing Act', agency: 'Guam Department of Labor', notes: 'Federal protections' },
        'VI': { name: 'US Virgin Islands', law: 'Virgin Islands Fair Housing Act', agency: 'VI Civil Rights Commission', notes: 'Federal protections' },
    };

    // ============================================
    // STATE LIST FOR DROPDOWN
    // ============================================
    const statesList = [
        { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
        { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'Washington DC' },
        { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
        { code: 'PR', name: 'Puerto Rico' }, { code: 'GU', name: 'Guam' }, { code: 'VI', name: 'US Virgin Islands' },
    ];

    // ============================================
    // CONTEXT PATTERNS (to reduce false positives)
    // ============================================
    const contextExclusions = [
        // Historical/educational context
        /\b(history of|historical|in the past|used to be|was once|formerly)\b/gi,
        // Quoting/referencing
        /\b(according to|as stated|the term|defined as|refers to|means)\b/gi,
        // Legal text
        /\b(pursuant to|in accordance with|as required by|under the)\b/gi,
    ];

    // ============================================
    // SAFE PHRASES (commonly flagged but OK)
    // ============================================
    const safePhrases = [
        /\bwalking distance to schools?\b/gi,
        /\bfamily.?friendly amenities\b/gi,
        /\bpet.?friendly\b/gi,
        /\bnear public transportation\b/gi,
        /\bclose to shopping\b/gi,
        /\bwalk to parks?\b/gi,
        /\bquiet street\b/gi,
        /\bprivate backyard\b/gi,
        /\bopen floor plan\b/gi,
        /\bnatural light\b/gi,
        /\bupdated kitchen\b/gi,
        /\bhardwood floors\b/gi,
        /\bstainless steel appliances\b/gi,
        /\bgranite countertops\b/gi,
        /\bin.?unit laundry\b/gi,
        /\bcentral air\b/gi,
        /\bhigh ceilings\b/gi,
        /\bgreat location\b/gi,
        /\bmove.?in ready\b/gi,
        /\bturnkey\b/gi,
    ];

    // ============================================
    // MAIN SCAN FUNCTION
    // ============================================
    function scan(text, stateCode = null, options = {}) {
        const violations = [];
        const {
            includeContext = true,
            includeSuggestions = true,
            strictMode = false
        } = options;

        if (!text || typeof text !== 'string') return violations;

        // Normalize text
        const normalizedText = text.replace(/\s+/g, ' ').trim();

        // Check if text is in safe/educational context (unless strict mode)
        if (!strictMode) {
            const isEducationalContext = contextExclusions.some(pattern => pattern.test(normalizedText));
            if (isEducationalContext) {
                return violations; // Skip scanning educational/historical content
            }
        }

        // Always check federal violations
        federalViolations.forEach(rule => {
            // Reset regex lastIndex
            rule.pattern.lastIndex = 0;
            const matches = normalizedText.match(rule.pattern);
            if (matches) {
                // Filter out safe phrases
                const filteredMatches = matches.filter(match => {
                    return !safePhrases.some(safe => {
                        safe.lastIndex = 0;
                        return safe.test(match);
                    });
                });

                if (filteredMatches.length > 0) {
                    const context = includeContext ? extractContext(normalizedText, filteredMatches[0]) : null;
                    violations.push({
                        type: rule.type,
                        matches: [...new Set(filteredMatches.map(m => m.trim()))],
                        suggestion: includeSuggestions ? rule.suggestion : null,
                        replacement: rule.replacement || null,
                        severity: rule.severity,
                        level: 'Federal',
                        law: rule.law || 'FHA',
                        context: context
                    });
                }
            }
        });

        // Check state-specific violations
        if (stateCode) {
            Object.keys(stateProtections).forEach(category => {
                if (stateProtections[category].includes(stateCode) && stateViolations[category]) {
                    stateViolations[category].forEach(rule => {
                        rule.pattern.lastIndex = 0;
                        const matches = normalizedText.match(rule.pattern);
                        if (matches) {
                            const filteredMatches = matches.filter(match => {
                                return !safePhrases.some(safe => {
                                    safe.lastIndex = 0;
                                    return safe.test(match);
                                });
                            });

                            if (filteredMatches.length > 0) {
                                const stateInfo = stateLaws[stateCode];
                                const context = includeContext ? extractContext(normalizedText, filteredMatches[0]) : null;
                                violations.push({
                                    type: rule.type,
                                    matches: [...new Set(filteredMatches.map(m => m.trim()))],
                                    suggestion: includeSuggestions ? rule.suggestion : null,
                                    replacement: rule.replacement || null,
                                    severity: rule.severity,
                                    level: `State (${stateCode})`,
                                    law: stateInfo ? stateInfo.law : `${stateCode} State Law`,
                                    context: context
                                });
                            }
                        }
                    });
                }
            });
        }

        // Sort by severity
        const severityOrder = { high: 0, medium: 1, low: 2 };
        violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return violations;
    }

    // ============================================
    // EXTRACT CONTEXT
    // ============================================
    function extractContext(text, match, contextLength = 50) {
        const index = text.toLowerCase().indexOf(match.toLowerCase());
        if (index === -1) return null;

        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + match.length + contextLength);

        let context = text.substring(start, end);
        if (start > 0) context = '...' + context;
        if (end < text.length) context = context + '...';

        return context;
    }

    // ============================================
    // AUTO-FIX FUNCTION
    // ============================================
    function autoFix(text, stateCode = null) {
        if (!text || typeof text !== 'string') return { text: text, changes: [] };

        let fixedText = text;
        const changes = [];

        // Apply federal fixes
        federalViolations.forEach(rule => {
            if (rule.replacement !== undefined) {
                rule.pattern.lastIndex = 0;
                const matches = fixedText.match(rule.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const replacement = rule.replacement;
                        if (replacement !== match) {
                            changes.push({
                                original: match,
                                replacement: replacement || '[REMOVED]',
                                type: rule.type,
                                severity: rule.severity
                            });
                        }
                    });
                    rule.pattern.lastIndex = 0;
                    fixedText = fixedText.replace(rule.pattern, rule.replacement);
                }
            }
        });

        // Apply state-specific fixes
        if (stateCode) {
            Object.keys(stateProtections).forEach(category => {
                if (stateProtections[category].includes(stateCode) && stateViolations[category]) {
                    stateViolations[category].forEach(rule => {
                        if (rule.replacement !== undefined) {
                            rule.pattern.lastIndex = 0;
                            const matches = fixedText.match(rule.pattern);
                            if (matches) {
                                matches.forEach(match => {
                                    const replacement = rule.replacement;
                                    if (replacement !== match) {
                                        changes.push({
                                            original: match,
                                            replacement: replacement || '[REMOVED]',
                                            type: rule.type,
                                            severity: rule.severity
                                        });
                                    }
                                });
                                rule.pattern.lastIndex = 0;
                                fixedText = fixedText.replace(rule.pattern, rule.replacement);
                            }
                        }
                    });
                }
            });
        }

        // Clean up extra spaces
        fixedText = fixedText.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();

        return {
            text: fixedText,
            changes: changes,
            originalLength: text.length,
            fixedLength: fixedText.length
        };
    }

    // ============================================
    // GET STATE PROTECTIONS
    // ============================================
    function getStateProtections(stateCode) {
        const protections = ['Race', 'Color', 'National Origin', 'Religion', 'Sex', 'Familial Status', 'Disability'];

        if (!stateCode) return protections;

        if (stateProtections.sourceOfIncome.includes(stateCode)) protections.push('Source of Income');
        if (stateProtections.maritalStatus.includes(stateCode)) protections.push('Marital Status');
        if (stateProtections.military.includes(stateCode)) protections.push('Military/Veteran Status');
        if (stateProtections.age.includes(stateCode)) protections.push('Age');
        if (stateProtections.ancestry.includes(stateCode)) protections.push('Ancestry/Citizenship');
        if (stateProtections.sexualOrientation.includes(stateCode)) protections.push('Sexual Orientation');
        if (stateProtections.genderIdentity.includes(stateCode)) protections.push('Gender Identity');
        if (stateProtections.domesticViolence.includes(stateCode)) protections.push('DV Victim Status');
        if (stateProtections.immigration.includes(stateCode)) protections.push('Immigration Status');
        if (stateProtections.genetic.includes(stateCode)) protections.push('Genetic Information');
        if (stateProtections.student.includes(stateCode)) protections.push('Student Status');
        if (stateProtections.occupation.includes(stateCode)) protections.push('Lawful Occupation');
        if (stateProtections.primaryLanguage.includes(stateCode)) protections.push('Primary Language');
        if (stateProtections.medicalCondition.includes(stateCode)) protections.push('Medical Condition');
        if (stateProtections.arbitrary.includes(stateCode)) protections.push('Arbitrary (Unruh)');
        if (stateProtections.politicalAffiliation.includes(stateCode)) protections.push('Political Affiliation');
        if (stateProtections.publicAssistance.includes(stateCode)) protections.push('Public Assistance');
        if (stateProtections.parentalStatus.includes(stateCode)) protections.push('Parental Status');
        if (stateProtections.personalAppearance.includes(stateCode)) protections.push('Personal Appearance');
        if (stateProtections.matriculation.includes(stateCode)) protections.push('Matriculation');
        if (stateProtections.victimOfCrime.includes(stateCode)) protections.push('Victim of Crime');

        return protections;
    }

    // ============================================
    // CALCULATE COMPLIANCE SCORE
    // ============================================
    function calculateScore(violations) {
        if (!violations || violations.length === 0) return 100;

        let deductions = 0;
        violations.forEach(v => {
            switch (v.severity) {
                case 'high': deductions += 25; break;
                case 'medium': deductions += 10; break;
                case 'low': deductions += 5; break;
            }
        });

        return Math.max(0, 100 - deductions);
    }

    // ============================================
    // GET RISK LEVEL
    // ============================================
    function getRiskLevel(violations) {
        if (!violations || violations.length === 0) return { level: 'compliant', color: '#059669', label: 'Compliant' };

        const hasHigh = violations.some(v => v.severity === 'high');
        const hasMedium = violations.some(v => v.severity === 'medium');

        if (hasHigh) return { level: 'high', color: '#DC2626', label: 'High Risk' };
        if (hasMedium) return { level: 'medium', color: '#D97706', label: 'Medium Risk' };
        return { level: 'low', color: '#6B7280', label: 'Low Risk' };
    }

    // ============================================
    // EXPORT RESULTS
    // ============================================
    function exportResults(violations, format = 'json', stateCode = null) {
        const timestamp = new Date().toISOString();
        const stateInfo = stateCode ? stateLaws[stateCode] : null;

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify({
                    timestamp: timestamp,
                    state: stateCode,
                    stateInfo: stateInfo,
                    totalViolations: violations.length,
                    score: calculateScore(violations),
                    riskLevel: getRiskLevel(violations),
                    violations: violations
                }, null, 2);

            case 'csv':
                const headers = ['Type', 'Severity', 'Level', 'Law', 'Matches', 'Suggestion'];
                const rows = violations.map(v => [
                    v.type,
                    v.severity,
                    v.level,
                    v.law,
                    `"${v.matches.join('; ')}"`,
                    `"${v.suggestion || ''}"`
                ]);
                return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

            case 'text':
            case 'txt':
                let text = `Fair Housing Compliance Report\n`;
                text += `Generated: ${timestamp}\n`;
                text += `State: ${stateCode || 'Federal Only'}\n`;
                text += `Score: ${calculateScore(violations)}/100\n`;
                text += `Risk Level: ${getRiskLevel(violations).label}\n`;
                text += `Total Issues: ${violations.length}\n\n`;
                text += `${'='.repeat(50)}\n\n`;

                violations.forEach((v, i) => {
                    text += `Issue #${i + 1}: ${v.type}\n`;
                    text += `Severity: ${v.severity.toUpperCase()}\n`;
                    text += `Level: ${v.level}\n`;
                    text += `Law: ${v.law}\n`;
                    text += `Found: "${v.matches.join('", "')}"\n`;
                    text += `Suggestion: ${v.suggestion}\n`;
                    text += `\n${'-'.repeat(30)}\n\n`;
                });

                return text;

            case 'html':
                return generateHTMLReport(violations, stateCode);

            default:
                return JSON.stringify(violations);
        }
    }

    // ============================================
    // GENERATE HTML REPORT
    // ============================================
    function generateHTMLReport(violations, stateCode) {
        const score = calculateScore(violations);
        const risk = getRiskLevel(violations);
        const stateInfo = stateCode ? stateLaws[stateCode] : null;

        return `<!DOCTYPE html>
<html>
<head>
    <title>Fair Housing Compliance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: ${risk.color}; }
        .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; background: ${risk.color}; color: white; font-weight: 600; }
        .violation { border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid; }
        .violation.high { border-left-color: #DC2626; }
        .violation.medium { border-left-color: #D97706; }
        .violation.low { border-left-color: #9CA3AF; }
        .type { font-weight: 600; font-size: 1.1rem; }
        .matches { background: #FEF2F2; padding: 8px; border-radius: 4px; margin: 8px 0; color: #DC2626; }
        .suggestion { color: #059669; }
        .meta { font-size: 0.85rem; color: #6B7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Fair Housing Compliance Report</h1>
        <div class="score">${score}/100</div>
        <div class="risk-badge">${risk.label}</div>
        <p>Generated: ${new Date().toLocaleString()}</p>
        ${stateInfo ? `<p>State: ${stateInfo.name} (${stateInfo.law})</p>` : '<p>Federal Compliance Check</p>'}
    </div>

    <h2>Issues Found: ${violations.length}</h2>

    ${violations.map(v => `
        <div class="violation ${v.severity}">
            <div class="type">${v.type}</div>
            <div class="meta">${v.level} | ${v.severity.toUpperCase()} | ${v.law}</div>
            <div class="matches"><strong>Found:</strong> "${v.matches.join('", "')}"</div>
            <div class="suggestion">💡 ${v.suggestion}</div>
        </div>
    `).join('')}

    <footer style="margin-top: 40px; text-align: center; color: #6B7280; font-size: 0.85rem;">
        <p>This report is for informational purposes only and does not constitute legal advice.</p>
        <p>REtotalAI Fair Housing Compliance Scanner</p>
    </footer>
</body>
</html>`;
    }

    // ============================================
    // RENDER RESULTS
    // ============================================
    function renderResults(violations, containerId, stateCode = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const protections = getStateProtections(stateCode);
        const stateInfo = stateCode ? stateLaws[stateCode] : null;
        const score = calculateScore(violations);
        const risk = getRiskLevel(violations);

        if (violations.length === 0) {
            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border: 1px solid #059669; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: flex-start; gap: 14px;">
                        <div style="width: 48px; height: 48px; background: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <span style="font-size: 24px; color: white;">✓</span>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 1.1rem; color: #065F46; margin-bottom: 4px;">Fair Housing Compliant</div>
                            <div style="font-size: 2rem; font-weight: bold; color: #059669;">Score: 100/100</div>
                            <div style="font-size: 0.9rem; color: #047857; margin-top: 8px;">No potential violations detected in this content.</div>
                            ${stateCode ? `
                                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(5,150,105,0.3);">
                                    <div style="font-size: 0.75rem; color: #065F46;">
                                        <strong>Checked:</strong> ${protections.length} protected classes
                                        ${stateInfo ? `<br><strong>Law:</strong> ${stateInfo.law} (${stateInfo.agency})` : ''}
                                        ${stateInfo && stateInfo.notes ? `<br><strong>Notes:</strong> ${stateInfo.notes}` : ''}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            const highCount = violations.filter(v => v.severity === 'high').length;
            const mediumCount = violations.filter(v => v.severity === 'medium').length;
            const lowCount = violations.filter(v => v.severity === 'low').length;

            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border: 1px solid #DC2626; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: ${risk.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <span style="font-size: 24px; color: white;">⚠</span>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 1.1rem; color: #991B1B; margin-bottom: 4px;">
                                ${violations.length} Potential Violation${violations.length > 1 ? 's' : ''} Found
                            </div>
                            <div style="font-size: 2rem; font-weight: bold; color: ${risk.color};">Score: ${score}/100</div>
                            <div style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${risk.color}; color: white; font-size: 0.8rem; font-weight: 600; margin-top: 8px;">${risk.label}</div>
                            <div style="display: flex; gap: 12px; font-size: 0.8rem; margin-top: 12px;">
                                ${highCount > 0 ? `<span style="color: #DC2626;">● ${highCount} High Risk</span>` : ''}
                                ${mediumCount > 0 ? `<span style="color: #D97706;">● ${mediumCount} Medium</span>` : ''}
                                ${lowCount > 0 ? `<span style="color: #6B7280;">● ${lowCount} Low</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div style="max-height: 400px; overflow-y: auto; margin-bottom: 12px;">
                        ${violations.map(v => `
                            <div style="background: white; border-radius: 8px; padding: 14px; margin-bottom: 10px; border-left: 4px solid ${v.severity === 'high' ? '#DC2626' : v.severity === 'medium' ? '#D97706' : '#9CA3AF'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                    <span style="font-weight: 600; font-size: 0.9rem; color: #1E293B;">${v.type}</span>
                                    <div style="display: flex; gap: 6px;">
                                        <span style="font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; background: ${v.level === 'Federal' ? '#EEF2FF' : '#FEF3C7'}; color: ${v.level === 'Federal' ? '#4338CA' : '#92400E'}; font-weight: 500;">${v.level}</span>
                                        <span style="font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; background: ${v.severity === 'high' ? '#FEE2E2' : v.severity === 'medium' ? '#FEF3C7' : '#F3F4F6'}; color: ${v.severity === 'high' ? '#DC2626' : v.severity === 'medium' ? '#D97706' : '#6B7280'}; font-weight: 500;">${v.severity.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div style="font-size: 0.8rem; color: #DC2626; margin-bottom: 8px; padding: 8px; background: #FEF2F2; border-radius: 4px;">
                                    <strong>Found:</strong> "${v.matches.join('", "')}"
                                </div>
                                ${v.context ? `
                                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 8px; padding: 8px; background: #F9FAFB; border-radius: 4px; font-style: italic;">
                                        Context: ${v.context}
                                    </div>
                                ` : ''}
                                <div style="font-size: 0.8rem; color: #059669; display: flex; align-items: flex-start; gap: 6px;">
                                    <span>💡</span>
                                    <span>${v.suggestion}</span>
                                </div>
                                ${v.replacement ? `
                                    <div style="font-size: 0.75rem; color: #4338CA; margin-top: 6px;">
                                        <strong>Suggested replacement:</strong> "${v.replacement || 'Remove this phrase'}"
                                    </div>
                                ` : ''}
                                <div style="font-size: 0.7rem; color: #6B7280; margin-top: 6px;">
                                    Reference: ${v.law}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    ${stateCode ? `
                        <div style="font-size: 0.75rem; color: #991B1B; padding-top: 12px; border-top: 1px solid rgba(220,38,38,0.3);">
                            Scanned ${protections.length} protected classes for ${stateCode}
                            ${stateInfo ? ` • ${stateInfo.law}` : ''}
                            ${stateInfo && stateInfo.notes ? ` • ${stateInfo.notes}` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }

    // ============================================
    // RENDER STATE DROPDOWN
    // ============================================
    function renderStateDropdown(containerId, selectedState = '') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <label style="font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 8px; display: block;">
                Select State for Compliance Check
            </label>
            <select id="fhsStateSelect" style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 0.9rem; background: white; cursor: pointer;">
                <option value="">Federal Only (All 50 States)</option>
                <optgroup label="States with Additional Protections">
                    ${statesList.filter(s => Object.values(stateProtections).some(arr => arr.includes(s.code))).map(s =>
                        `<option value="${s.code}" ${s.code === selectedState ? 'selected' : ''}>${s.name} ${stateLaws[s.code] ? '(' + stateLaws[s.code].notes + ')' : ''}</option>`
                    ).join('')}
                </optgroup>
                <optgroup label="Federal Protections Only">
                    ${statesList.filter(s => !Object.values(stateProtections).some(arr => arr.includes(s.code))).map(s =>
                        `<option value="${s.code}" ${s.code === selectedState ? 'selected' : ''}>${s.name}</option>`
                    ).join('')}
                </optgroup>
            </select>
            <div id="fhsStateInfo" style="margin-top: 8px; font-size: 0.8rem; color: #6B7280;"></div>
        `;

        // Add change listener
        document.getElementById('fhsStateSelect').addEventListener('change', function() {
            updateStateInfo(this.value);
        });

        // Initial update
        updateStateInfo(selectedState);
    }

    // ============================================
    // UPDATE STATE INFO
    // ============================================
    function updateStateInfo(stateCode) {
        const infoEl = document.getElementById('fhsStateInfo');
        if (!infoEl) return;

        const protections = getStateProtections(stateCode);
        const stateInfo = stateCode ? stateLaws[stateCode] : null;
        const stateSpecific = protections.slice(7);

        if (!stateCode) {
            infoEl.innerHTML = `<span style="color: #6B7280;">Checking 7 federal protected classes (FHA)</span>`;
        } else if (stateSpecific.length > 0) {
            infoEl.innerHTML = `
                <span style="color: #059669; font-weight: 500;">${protections.length} protected classes</span>
                <br>
                <span style="color: #6B7280;">State adds: ${stateSpecific.join(', ')}</span>
                ${stateInfo ? `<br><span style="color: #4F46E5;">Law: ${stateInfo.law}</span>` : ''}
                ${stateInfo && stateInfo.agency ? `<br><span style="color: #6B7280;">Agency: ${stateInfo.agency}</span>` : ''}
            `;
        } else {
            infoEl.innerHTML = `<span style="color: #6B7280;">${stateCode} follows federal protections only (7 classes)</span>`;
        }
    }

    // ============================================
    // QUICK SCAN (returns summary)
    // ============================================
    function quickScan(text, stateCode = null) {
        const violations = scan(text, stateCode);
        return {
            isCompliant: violations.length === 0,
            hasHighRisk: violations.some(v => v.severity === 'high'),
            hasMediumRisk: violations.some(v => v.severity === 'medium'),
            count: violations.length,
            score: calculateScore(violations),
            riskLevel: getRiskLevel(violations),
            violations: violations
        };
    }

    // ============================================
    // BATCH SCAN (multiple listings)
    // ============================================
    function batchScan(listings, stateCode = null) {
        return listings.map((listing, index) => ({
            index: index,
            text: typeof listing === 'string' ? listing : listing.text,
            id: typeof listing === 'object' ? listing.id : null,
            ...quickScan(typeof listing === 'string' ? listing : listing.text, stateCode)
        }));
    }

    // ============================================
    // GET COMPLIANT ALTERNATIVES
    // ============================================
    function getCompliantAlternatives(phrase) {
        const alternatives = {
            'master bedroom': ['primary bedroom', 'owner\'s suite', 'main bedroom'],
            'master bath': ['primary bathroom', 'en-suite bathroom', 'main bathroom'],
            'man cave': ['bonus room', 'recreation room', 'flex space'],
            'bachelor pad': ['studio apartment', 'urban living space'],
            'mother-in-law suite': ['guest suite', 'accessory dwelling unit', 'additional living space'],
            'nursery': ['bonus room', 'flexible space', 'fourth bedroom'],
            'walk-in closet': ['large closet', 'spacious closet'],
            'handicap accessible': ['accessible', 'ADA compliant', 'wheelchair accessible'],
            'perfect for families': ['spacious layout', 'multiple bedrooms', 'large backyard'],
            'ideal for singles': ['efficient floor plan', 'low maintenance'],
            'great for couples': ['open floor plan', 'cozy layout'],
            'no section 8': ['[REMOVE - illegal in many states]'],
            'adults only': ['[REMOVE - illegal except 55+ housing]'],
            'no children': ['[REMOVE - illegal]'],
            'christian community': ['[REMOVE - illegal]'],
            'safe neighborhood': ['well-maintained area', 'established community'],
            'good schools': ['[Use school ratings websites instead]'],
            'quiet neighborhood': ['peaceful setting', 'tree-lined streets'],
            'exclusive area': ['desirable location', 'sought-after area'],
        };

        const lowerPhrase = phrase.toLowerCase().trim();
        return alternatives[lowerPhrase] || null;
    }

    // ============================================
    // EXPORT PUBLIC API
    // ============================================
    return {
        // Core functions
        scan: scan,
        quickScan: quickScan,
        batchScan: batchScan,
        autoFix: autoFix,

        // Scoring and risk
        calculateScore: calculateScore,
        getRiskLevel: getRiskLevel,

        // State information
        getStateProtections: getStateProtections,
        statesList: statesList,
        stateLaws: stateLaws,
        stateProtections: stateProtections,

        // UI rendering
        renderResults: renderResults,
        renderStateDropdown: renderStateDropdown,
        updateStateInfo: updateStateInfo,

        // Export and alternatives
        exportResults: exportResults,
        getCompliantAlternatives: getCompliantAlternatives,

        // Version info
        version: '2.0.0',
        lastUpdated: '2026-01-18'
    };

})();

// Make available globally
if (typeof window !== 'undefined') {
    window.FairHousingScanner = FairHousingScanner;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FairHousingScanner;
}
