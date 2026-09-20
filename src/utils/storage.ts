import {
  StaffMember,
  Classroom,
  Learner,
  GateAttendanceRecord,
  PeriodTeachingSession,
  SchoolConfig,
  PunctualityStatus,
  NonTeachingStaffMember,
  NonTeachingAttendanceRecord,
} from '../types';

const STORAGE_KEYS = {
  STAFF: 'ges_staff_roster_v1',
  CLASSROOMS: 'ges_classrooms_v1',
  GATE_ATTENDANCE: 'ges_gate_attendance_v1',
  PERIOD_SESSIONS: 'ges_period_sessions_v1',
  NON_TEACHING_STAFF: 'ges_non_teaching_staff_v1',
  NON_TEACHING_ATTENDANCE: 'ges_non_teaching_attendance_v1',
  CONFIG: 'ges_school_config_v1',
  SYNC_QUEUE: 'ges_sync_queue_v1',
  LAST_SYNC: 'ges_last_sync_timestamp',
  DEVICE_MODE: 'ges_device_operating_mode_v1',
  BOUND_STAFF_ID: 'ges_byod_bound_staff_id_v1',
};

// Default School Configuration (Ho / Volta Region - GES Standards)
export const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: 'Mawuli Senior High School',
  schoolCode: 'GES-VR-HO-002',
  district: 'Ho Municipal',
  region: 'Volta Region',
  lat: 6.9167,
  lng: 0.2833,
  radiusMeters: 200,
  onTimeCutoff: '07:45',
  lateCutoff: '08:30',
  closingTime: '14:30',
  superAdminPin: '1234',
};

// Initial Seed Staff Roster (Populated directly from the official School Master Teacher List & aSc Timetables)
export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-16',
    staffId: '1304201',
    name: 'Mr. Eugene Fafali Esianyo',
    department: 'Mathematics & Business',
    phone: '+233 24 879 3773',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc. Admin (Acct), PGDE',
    avatarColor: 'from-emerald-600 to-teal-700',
    subjects: ['Core Mathematics', 'Elective Mathematics', 'Additional Mathematics'],
  },
  {
    id: 'staff-1',
    staffId: '707086',
    name: 'Mr. Samuel Numatsi',
    department: 'Business & Social Sciences',
    phone: '+233 24 678 2617',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc. Accounting & Finance',
    avatarColor: 'from-blue-600 to-indigo-700',
    subjects: ['Financial Accounting', 'Government'],
  },
  {
    id: 'staff-2',
    staffId: '706711',
    name: 'Mr. Sylvanus Sunday Semaxa',
    department: 'Business & Economics',
    phone: '+233 24 286 9055',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc. Management Education',
    avatarColor: 'from-amber-600 to-orange-700',
    subjects: ['Business Management', 'Economics'],
  },
  {
    id: 'staff-3',
    staffId: '648991',
    name: 'Mr. Richard Dodzi Keteku',
    department: 'Information Technology & Arts',
    phone: '+233 54 073 8086',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc. Information Technology',
    avatarColor: 'from-purple-600 to-indigo-700',
    subjects: ['Design & Comm Tech', 'Information Technology'],
  },
  {
    id: 'staff-4',
    staffId: '1254416',
    name: 'Mr. Richard Asiedu',
    department: 'Visual Arts & Guidance',
    phone: '+233 24 195 8545',
    pin: '1234',
    role: 'HOD',
    category: 'permanent',
    rank: 'B.Ed Guidance & Counselling',
    avatarColor: 'from-cyan-600 to-blue-700',
    subjects: ['Art and Design Foundation', 'Guidance & Counselling'],
  },
  {
    id: 'staff-5',
    staffId: '1547764',
    name: 'Mr. Issor Mbiba',
    department: 'Visual Arts',
    phone: '+233 54 367 0233',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'B.Ed Art Education',
    avatarColor: 'from-fuchsia-600 to-pink-700',
    subjects: ['Art and Design Studio', 'Studio Practice'],
  },
  {
    id: 'staff-6',
    staffId: '623941',
    name: 'Miss Patience Dzigbordi Amaglo',
    department: 'Languages & Literature',
    phone: '+233 24 664 8032',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BA English, M.Ed Supervision',
    avatarColor: 'from-rose-600 to-pink-700',
    subjects: ['Literature in English', 'English Language'],
  },
  {
    id: 'staff-7',
    staffId: '1358346',
    name: 'Miss Emelda Abena Wawo',
    department: 'Languages',
    phone: '+233 54 110 1668',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'B.Ed in English Language',
    avatarColor: 'from-emerald-600 to-green-700',
    subjects: ['English Language', 'Integrated English'],
  },
  {
    id: 'staff-8',
    staffId: '953124',
    name: 'Mr. Augustine Ottuh',
    department: 'Social Sciences',
    phone: '+233 24 695 9036',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BA Geography & Rural Dev.',
    avatarColor: 'from-blue-600 to-sky-700',
    subjects: ['Geography'],
  },
  {
    id: 'staff-9',
    staffId: '814652',
    name: 'Mr. Emmanuel Agbewowoele',
    department: 'Religious Studies & Chaplaincy',
    phone: '+233 54 366 7591',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc. Accounting Education',
    avatarColor: 'from-teal-600 to-cyan-700',
    subjects: ['Christian Religious Studies', 'School Worship Coordinator'],
  },
  {
    id: 'staff-10',
    staffId: '948389',
    name: 'Miss Charity Akosua Sabbah',
    department: 'Social Sciences & Counselling',
    phone: '+233 24 639 7354',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'B.Ed Counselling Psychology',
    avatarColor: 'from-violet-600 to-purple-700',
    subjects: ['Social Studies', 'Guidance & Counselling'],
  },
  {
    id: 'staff-11',
    staffId: '1525610',
    name: 'Mary Agyei Kyeremeh',
    department: 'Social Sciences',
    phone: '+233 24 660 2286',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'B.Ed Social Studies',
    avatarColor: 'from-lime-600 to-emerald-700',
    subjects: ['Social Studies'],
  },
  {
    id: 'staff-12',
    staffId: '939231',
    name: 'Miss Harriet Tsamanyi',
    department: 'Home Economics',
    phone: '+233 24 841 9073',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'MPhil Family Resource Mgmt',
    avatarColor: 'from-amber-600 to-yellow-700',
    subjects: ['Food & Nutrition', 'Management in Living'],
  },
  {
    id: 'staff-13',
    staffId: '1417900',
    name: 'Miss Jenny Akwaley Nuertey',
    department: 'Home Economics',
    phone: '+233 24 684 4131',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc Fashion & Textiles Design',
    avatarColor: 'from-orange-600 to-amber-700',
    subjects: ['Clothing & Textiles', 'Management in Living'],
  },
  {
    id: 'staff-14',
    staffId: '1220681',
    name: 'Miss Leticia Agbewu',
    department: 'Home Economics',
    phone: '+233 54 037 4447',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'B.Ed Home Economics',
    avatarColor: 'from-rose-600 to-red-700',
    subjects: ['Food and Nutrition'],
  },
  {
    id: 'staff-15',
    staffId: '281351',
    name: 'Mr. Segbaya Koku Ahialoho',
    department: 'Languages',
    phone: '+233 24 271 8901',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BA French',
    avatarColor: 'from-indigo-600 to-violet-700',
    subjects: ['French', 'English Language'],
  },
  {
    id: 'staff-17',
    staffId: '1199492',
    name: 'Mr. Koffi Toku',
    department: 'Languages',
    phone: '+233 24 102 5439',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BA French',
    avatarColor: 'from-cyan-600 to-teal-700',
    subjects: ['French', 'English Language'],
  },
  {
    id: 'staff-18',
    staffId: '819744',
    name: 'Mr. Musan Mohammed',
    department: 'Mathematics',
    phone: '+233 24 107 4939',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'B.Ed Mathematics',
    avatarColor: 'from-emerald-600 to-teal-700',
    subjects: ['Mathematics'],
  },
  {
    id: 'staff-19',
    staffId: '623736',
    name: 'Mr. Komla Erasmus Boateng',
    department: 'Mathematics & Science',
    phone: '+233 24 511 7848',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc Mathematics Education',
    avatarColor: 'from-teal-600 to-emerald-700',
    subjects: ['Elective Mathematics', 'Core Mathematics', 'Additional Mathematics'],
  },
  {
    id: 'staff-20',
    staffId: '1242093',
    name: 'Mr. Desmond Dzorkplenu',
    department: 'Mathematics & Economics',
    phone: '+233 55 619 5518',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc Maths with Economics Ed.',
    avatarColor: 'from-green-600 to-emerald-700',
    subjects: ['Core Mathematics', 'Economics'],
  },
  {
    id: 'staff-21',
    staffId: '748589',
    name: 'Mr. David Goka',
    department: 'General Science & Agriculture',
    phone: '+233 24 305 8050',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc. Agric Science Education',
    avatarColor: 'from-blue-600 to-indigo-700',
    subjects: ['Integrated Science', 'Physics', 'Chemistry', 'Agric Science'],
  },
  {
    id: 'staff-22',
    staffId: '748954',
    name: 'Miss Veronica Adorkor',
    department: 'General Science',
    phone: '+233 24 699 6559',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc Integrated Science Ed.',
    avatarColor: 'from-rose-600 to-red-700',
    subjects: ['Biology', 'Integrated Science'],
  },
  {
    id: 'staff-23',
    staffId: '704182',
    name: 'Mr. Prince Yayra',
    department: 'Information & Communications Tech',
    phone: '+233 55 088 0394',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc. IT Education',
    avatarColor: 'from-pink-600 to-rose-700',
    subjects: ['Computing', 'ICT'],
  },
  {
    id: 'staff-24',
    staffId: '867298',
    name: 'Mr. Richard Mawuli Adare',
    department: 'Information & Communications Tech',
    phone: '+233 24 729 9391',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc ICT',
    avatarColor: 'from-purple-600 to-violet-700',
    subjects: ['ICT'],
  },
  {
    id: 'staff-25',
    staffId: '1222669',
    name: 'Mr. Enoch Kwasi Adiasie',
    department: 'Physical Education & Health',
    phone: '+233 24 140 6061',
    pin: '1234',
    role: 'Teacher',
    category: 'permanent',
    rank: 'BSc in Physical Education',
    avatarColor: 'from-amber-600 to-yellow-700',
    subjects: ['Physical Education & Health (Core)', 'PEH Elective'],
  },
  {
    id: 'staff-26',
    staffId: '666510',
    name: 'Mr. Kennedy Keteke',
    department: 'Administration & Psychology',
    phone: '+233 24 498 3516',
    pin: '1234',
    role: 'Assistant Head',
    category: 'permanent',
    rank: 'M.Ed Educ. Admin, B.Ed Psychology',
    avatarColor: 'from-red-600 to-rose-800',
    subjects: ['Educational Administration', 'Psychology'],
  },
  {
    id: 'staff-nss-1',
    staffId: 'NSS-2024-041',
    name: 'Ms. Beatrice Agbemava',
    department: 'Vocational & Arts',
    phone: '+233 24 331 4455',
    pin: '1234',
    role: 'Teacher',
    category: 'nss',
    rank: 'National Service Personnel (NSP)',
    avatarColor: 'from-teal-600 to-emerald-700',
    subjects: ['Food & Nutrition', 'General Knowledge in Art'],
  },
  {
    id: 'staff-intern-1',
    staffId: 'INT-2024-012',
    name: 'Mr. Johnathan Quarshie',
    department: 'Physical Education & Health',
    phone: '+233 26 778 9900',
    pin: '1234',
    role: 'Staff',
    category: 'intern',
    rank: 'Student Teacher (Intern)',
    avatarColor: 'from-orange-600 to-amber-700',
    subjects: ['Physical Education', 'Health Science'],
  },
];

function createClassRoster(classCode: string, className: string, names: string[]): Learner[] {
  return names.map((name, i) => ({
    id: `lrn-${classCode.toLowerCase()}-${i + 1}`,
    rollNo: i + 1,
    name,
    classCode,
    className,
  }));
}

// Initial Classrooms with Preloaded Rosters directly matching the user's institutional database
export const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: 'cls-bcga3c',
    code: 'BCGA3C',
    name: 'GENERAL ARTS 3C',
    block: 'Arts Complex • 3rd Floor (Rm 301)',
    grade: 'Form 3',
    totalLearners: 8,
    roster: createClassRoster('BCGA3C', 'GENERAL ARTS 3C', [
      'AMARH ISABELLA',
      'BIYON DAVID MAKIWI',
      'DAGADU FAITH NEZUYAYRA',
      'ANNANG PRINCE LARYEA',
      'ADAM RAFATU ADINPUYA',
      'MUSTAPHA FAUZIA',
      'OPOKU GRACE',
      'JAGRI TIGNANKUME GODFRED',
    ]),
  },
  {
    id: 'cls-bcga3d',
    code: 'BCGA3D',
    name: 'GENERAL ARTS 3D',
    block: 'Arts Complex • 3rd Floor (Rm 302)',
    grade: 'Form 3',
    totalLearners: 3,
    roster: createClassRoster('BCGA3D', 'GENERAL ARTS 3D', [
      'JAMES KACHIRIBE MBEMBA',
      'EVA UJAKPA',
      'ELIZABETH DONKOH',
    ]),
  },
  {
    id: 'cls-bcga3e',
    code: 'BCGA3E',
    name: 'GENERAL ARTS 3E',
    block: 'Arts Complex • 3rd Floor (Rm 303)',
    grade: 'Form 3',
    totalLearners: 3,
    roster: createClassRoster('BCGA3E', 'GENERAL ARTS 3E', [
      'KRAH CHARLLOTTE',
      'AKPO LAWRETTA',
      'PADI GRACE',
    ]),
  },
  {
    id: 'cls-bcga3f',
    code: 'BCGA3F',
    name: 'GENERAL ARTS 3F',
    block: 'Arts Complex • 3rd Floor (Rm 304)',
    grade: 'Form 3',
    totalLearners: 3,
    roster: createClassRoster('BCGA3F', 'GENERAL ARTS 3F', [
      'DARKO GLORIA',
      'AKAKPO GIFTY',
      'GYASI RHODA',
    ]),
  },
  {
    id: 'cls-bche3b',
    code: 'BCHE3B',
    name: 'HOME ECONOMICS 3B',
    block: 'Vocational Complex • Food Lab A',
    grade: 'Form 3',
    totalLearners: 27,
    roster: createClassRoster('BCHE3B', 'HOME ECONOMICS 3B', [
      'ADIKA MARY',
      'GYEMUSAH MAJORY',
      'LIFANG MMEJIN GRACE',
      'SANDOL ERICA',
      'GODZO HANNAH',
      'OBIRI BERNICE',
      'AMETEFE EVELYN DZIFA',
      'HALILU AYISHA',
      'AGLUBI CHRISTABEL',
      'OFOSU MARY',
      'OGYIRI RITA',
      'UWUMBORIBE LAWRENCIA',
      'DALLEY GIFTY',
      'MBAKUM VIDA',
      'SOKPO SARAH',
      'ADAMS ZARATU',
      'N-YABEL HELENA',
      'MINTAH JANET',
      'APPIAH ELIZABETH',
      'UBAYAN EVA AMA',
      'AVORGBEDOR CHARITY YAA',
      'AMEDZOR CHRISTABEL',
      'HUNKPE CHANTELLE FAFALI',
      'TSIGBEY MAWUENA',
      'BENLIN DIANA',
      'YAABIR CYNTHIA',
      'BONSU REBECCA',
    ]),
  },
  {
    id: 'cls-bche3a',
    code: 'BCHE3A',
    name: 'HOME ECONOMICS 3A',
    block: 'Vocational Complex • Food Lab B',
    grade: 'Form 3',
    totalLearners: 9,
    roster: createClassRoster('BCHE3A', 'HOME ECONOMICS 3A', [
      'ADUWAA NANET',
      'AGBESI GRACE',
      'YADZO CHRISTIANA',
      'OBINPEH HANNAH',
      'OWUSU ROSALINDA',
      'ADDO SARAH',
      'AMADU ZUBEIDA',
      'COPSON GEORGIA',
      'ESTHER OWUSU',
    ]),
  },
  {
    id: 'cls-bcsva3',
    code: 'BCSVA3',
    name: 'VISUAL AND PERFORMING ARTS 3',
    block: 'Creative Arts Wing • Studio 3',
    grade: 'Form 3',
    totalLearners: 4,
    roster: createClassRoster('BCSVA3', 'VISUAL AND PERFORMING ARTS 3', [
      'MINIFEEBO AFOTEY FESTUS NII ODAI',
      'OWUSU DORCAS',
      'DZAGAH MILLICENT MAWUSINU',
      'APPIAH JOSEPH',
    ]),
  },
  {
    id: 'cls-bcsgs3',
    code: 'BCSGS3',
    name: 'GENERAL SCIENCE 3',
    block: 'Science Block • Lab 1',
    grade: 'Form 3',
    totalLearners: 3,
    roster: createClassRoster('BCSGS3', 'GENERAL SCIENCE 3', [
      'ADJORKEY RUTH AKUA',
      'SELORM KWAME ADJEI',
      'EMMANUEL TETTEH',
    ]),
  },
  {
    id: 'cls-bcsbu3',
    code: 'BCSBU3',
    name: 'BUSINESS 3',
    block: 'Business Wing • Room 305',
    grade: 'Form 3',
    totalLearners: 3,
    roster: createClassRoster('BCSBU3', 'BUSINESS 3', [
      'MOHAMMED RAFIA',
      'KENNETH KWABENA APPIAH',
      'PRISCILLA GYASI',
    ]),
  },
  {
    id: 'cls-bcga2f',
    code: 'BCGA2F',
    name: 'GENERAL ARTS 2F',
    block: 'Arts Complex • 2nd Floor (Rm 206)',
    grade: 'Form 2',
    totalLearners: 5,
    roster: createClassRoster('BCGA2F', 'GENERAL ARTS 2F', [
      'JONES NEWTON ISAAC',
      'ADU SHADRACK',
      'SERAPHINE MENSA',
      'PRISCILLA ANANE',
      'MICHAEL AMPOMAH',
    ]),
  },
  {
    id: 'cls-bche2a',
    code: 'BCHE2A',
    name: 'HOME ECONOMICS 2A',
    block: 'Vocational Complex • Room 201',
    grade: 'Form 2',
    totalLearners: 3,
    roster: createClassRoster('BCHE2A', 'HOME ECONOMICS 2A', [
      'LAMI ARIMIYAW',
      'BENEDICTA ASANTE',
      'ABIGAIL BOADI',
    ]),
  },
  {
    id: 'cls-bche2b',
    code: 'BCHE2B',
    name: 'HOME ECONOMICS 2B',
    block: 'Vocational Complex • Room 202',
    grade: 'Form 2',
    totalLearners: 3,
    roster: createClassRoster('BCHE2B', 'HOME ECONOMICS 2B', [
      'GABRIELLA ADZOVIE',
      'ERICA AGBENYEKE',
      'MARY HOSU',
    ]),
  },
  {
    id: 'cls-bcsva2',
    code: 'BCSVA2',
    name: 'VISUAL AND PERFORMING ARTS 2',
    block: 'Creative Arts Wing • Studio 2',
    grade: 'Form 2',
    totalLearners: 2,
    roster: createClassRoster('BCSVA2', 'VISUAL AND PERFORMING ARTS 2', [
      'COMFORT MAYEDEN',
      'JOE BINBOR',
    ]),
  },
  {
    id: 'cls-bcsag2',
    code: 'BCSAG2',
    name: 'AGRICULTURE 2',
    block: 'Agric Science Laboratory • Rm 101',
    grade: 'Form 2',
    totalLearners: 3,
    roster: createClassRoster('BCSAG2', 'AGRICULTURE 2', [
      'RICHARD NIGNANPAM UDJUOL',
      'YAW BOATENG',
      'MAVIS SARPONG',
    ]),
  },
  {
    id: 'cls-gen-art-2a',
    code: 'GEN_ART_2A',
    name: 'GEN ART 2A (AGRIC/FRENCH)',
    block: 'Arts Wing • Room 201',
    grade: 'Form 2',
    totalLearners: 5,
    roster: createClassRoster('GEN_ART_2A', 'GEN ART 2A (AGRIC/FRENCH)', [
      'KOFI MENSAH AGYAPONG',
      'SELORM ADADE DZIFA',
      'BLESSING OFFEI',
      'VICTORIA APPIAH',
      'EMMANUEL KWEKU SACKEY',
    ]),
  },
  {
    id: 'cls-gen-art-2c',
    code: 'GEN_ART_2C',
    name: 'GEN ART 2C (AGRIC/BIOLOGY)',
    block: 'Arts Wing • Room 203',
    grade: 'Form 2',
    totalLearners: 5,
    roster: createClassRoster('GEN_ART_2C', 'GEN ART 2C (AGRIC/BIOLOGY)', [
      'PRINCE OWUSU BOATENG',
      'DELALI MAWUENA AMEGASHIE',
      'CONSTANCE YAA FREMA',
      'GODWIN KWABENA TETTEH',
      'RUTH AFUA OSEI',
    ]),
  },
  {
    id: 'cls-gen-sci-2',
    code: 'GEN_SCI_2',
    name: 'GENERAL SCIENCE 2',
    block: 'Science Complex • Physics Lab',
    grade: 'Form 2',
    totalLearners: 6,
    roster: createClassRoster('GEN_SCI_2', 'GENERAL SCIENCE 2', [
      'KWAME BAFFOUR ADDO',
      'PRISCILLA NYARKO',
      'SAMUEL KOFI ADJEI',
      'FAUSTINA SERWAA',
      'JOSHUA NII LANTE',
      'ABIGAIL SENA NORTEY',
    ]),
  },
  {
    id: 'cls-business-2',
    code: 'BUSINESS_2',
    name: 'BUSINESS 2',
    block: 'Business Wing • Room 205',
    grade: 'Form 2',
    totalLearners: 5,
    roster: createClassRoster('BUSINESS_2', 'BUSINESS 2', [
      'MERCY ASANTEWAA',
      'COLLINS OPPONG',
      'BERNARD KODJO TETTEY',
      'VERA AKOSUA GYAMFI',
      'ELIZABETH ENYONAM',
    ]),
  },
  {
    id: 'cls-home-econ-1a',
    code: 'HOME_ECON_1A',
    name: 'HOME ECONOMICS 1A',
    block: 'Vocational Wing • Room 101',
    grade: 'Form 1',
    totalLearners: 5,
    roster: createClassRoster('HOME_ECON_1A', 'HOME ECONOMICS 1A', [
      'JENNIFER OSEI',
      'MAVIS DZIEDZORM',
      'DOROTHY ADDO',
      'PORTIA BAFFOE',
      'GLORIA MENSAH',
    ]),
  },
  {
    id: 'cls-gen-arts-1f',
    code: 'GEN_ARTS_1F',
    name: 'GEN. ARTS 1F (LIT IN ENG/C.R.S)',
    block: 'Arts Wing • Room 106',
    grade: 'Form 1',
    totalLearners: 5,
    roster: createClassRoster('GEN_ARTS_1F', 'GEN. ARTS 1F (LIT IN ENG/C.R.S)', [
      'BELINDA AGYEMANG',
      'DANIEL KWADWO OPOKU',
      'CYNTHIA MAWUFEMOR',
      'ISAAC BOATENG',
      'PATRICIA AFIA SEFA',
    ]),
  },
];

// Helper to get formatted today string (YYYY-MM-DD)
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial Sample Gate Attendance for today so dashboard is rich immediately
function getInitialGateAttendance(): GateAttendanceRecord[] {
  const today = getTodayDateString();
  return [
    {
      id: 'gate-seed-1',
      staffId: '1084291',
      staffName: 'Sir Eugene Mensah',
      department: 'Science & Mathematics',
      date: today,
      clockInTime: '07:28:14',
      clockInTimestamp: Date.now() - 3.5 * 3600000,
      clockInCoords: { lat: 6.91672, lng: 0.28331, accuracy: 12, distanceMeters: 14 },
      punctualityStatus: 'on_time',
      deviceSignature: 'GES-DEV-9B21-4E10',
      synced: true,
    },
    {
      id: 'gate-seed-2',
      staffId: '1092834',
      staffName: 'Mrs. Akosua Darko-Frimpong',
      department: 'Languages',
      date: today,
      clockInTime: '07:42:05',
      clockInTimestamp: Date.now() - 3.2 * 3600000,
      clockInCoords: { lat: 6.91668, lng: 0.28334, accuracy: 8, distanceMeters: 22 },
      punctualityStatus: 'on_time',
      deviceSignature: 'GES-DEV-A814-3C89',
      synced: true,
    },
    {
      id: 'gate-seed-3',
      staffId: '1048291',
      staffName: 'Mr. Kwame Boateng',
      department: 'General Science',
      date: today,
      clockInTime: '08:05:30',
      clockInTimestamp: Date.now() - 2.8 * 3600000,
      clockInCoords: { lat: 6.91675, lng: 0.28328, accuracy: 15, distanceMeters: 28 },
      punctualityStatus: 'late',
      deviceSignature: 'GES-DEV-55C1-22E4',
      synced: true,
    },
    {
      id: 'gate-seed-4',
      staffId: '1073319',
      staffName: 'Madam Faustina Adjei',
      department: 'Social Sciences',
      date: today,
      clockInTime: '07:35:12',
      clockInTimestamp: Date.now() - 3.4 * 3600000,
      clockInCoords: { lat: 6.91671, lng: 0.28330, accuracy: 9, distanceMeters: 18 },
      punctualityStatus: 'on_time',
      deviceSignature: 'GES-DEV-F770-91B2',
      synced: true,
    },
    {
      id: 'gate-seed-5',
      staffId: '1055412',
      staffName: 'Mr. Kofi Appiah-Danquah',
      department: 'Business & IT',
      date: today,
      clockInTime: '08:38:50',
      clockInTimestamp: Date.now() - 2.2 * 3600000,
      clockInCoords: { lat: 6.91665, lng: 0.28332, accuracy: 11, distanceMeters: 35 },
      punctualityStatus: 'substantially_late',
      deviceSignature: 'GES-DEV-31D9-08AA',
      synced: true,
    },
  ];
}

// Initial Sample Teaching Sessions
function getInitialTeachingSessions(): PeriodTeachingSession[] {
  const today = getTodayDateString();
  return [
    {
      id: 'period-seed-1',
      teacherId: 'staff-1',
      teacherName: 'Sir Eugene Mensah',
      teacherStaffId: '1084291',
      classroomId: 'cls-bcga3c',
      classCode: 'BCGA3C',
      className: 'GENERAL ARTS 3C',
      subject: 'Core Mathematics',
      date: today,
      startTime: '08:00',
      startTimestamp: Date.now() - 2.5 * 3600000,
      endTime: '09:10',
      endTimestamp: Date.now() - 1.33 * 3600000,
      elapsedMinutes: 70,
      totalRosterCount: 8,
      presentCount: 7,
      absentLearnerIds: ['lrn-bcga3c-4'],
      absentLearnerNames: ['ANNANG PRINCE LARYEA'],
      notes: 'Quadratic Equations & Graphing introductory core lecture completed.',
      synced: true,
    },
    {
      id: 'period-seed-2',
      teacherId: 'staff-2',
      teacherName: 'Mrs. Akosua Darko-Frimpong',
      teacherStaffId: '1092834',
      classroomId: 'cls-bche3b',
      classCode: 'BCHE3B',
      className: 'HOME ECONOMICS 3B',
      subject: 'English Language',
      date: today,
      startTime: '08:30',
      startTimestamp: Date.now() - 2.0 * 3600000,
      endTime: '09:40',
      endTimestamp: Date.now() - 0.83 * 3600000,
      elapsedMinutes: 70,
      totalRosterCount: 27,
      presentCount: 25,
      absentLearnerIds: ['lrn-bche3b-3', 'lrn-bche3b-12'],
      absentLearnerNames: ['LIFANG MMEJIN GRACE', 'UWUMBORIBE LAWRENCIA'],
      notes: 'Concord and formal essay writing structure.',
      synced: true,
    },
  ];
}

export const INITIAL_NON_TEACHING_STAFF: NonTeachingStaffMember[] = [
  {
    id: 'nt-1',
    staffId: 'GES-NT-001',
    name: 'Mr. Sylvanus K. Adzaho',
    role: 'Administrator',
    unit: 'General Administration & Records',
    phone: '+233 24 112 3456',
    phoneType: 'smartphone',
    shift: 'Administration (07:30 - 16:30)',
    pin: '1234',
    avatarColor: 'from-blue-600 to-indigo-700',
    category: 'permanent',
    barcode: 'GES-NT-001',
  },
  {
    id: 'nt-2',
    staffId: 'GES-NT-002',
    name: 'Mrs. Charity Dzifa Agbana',
    role: 'Bursar',
    unit: 'Bursary & Accounts Unit',
    phone: '+233 24 223 4567',
    phoneType: 'smartphone',
    shift: 'Administration (07:30 - 16:30)',
    pin: '2234',
    avatarColor: 'from-emerald-600 to-teal-700',
    category: 'permanent',
    barcode: 'GES-NT-002',
  },
  {
    id: 'nt-3',
    staffId: 'GES-NT-003',
    name: 'Mr. Isaac Tetteh Coffie',
    role: 'Storekeeper',
    unit: 'Stores, Inventory & Supplies',
    phone: '+233 20 334 5678',
    phoneType: 'yam_phone',
    shift: 'Standard Duty (08:00 - 16:00)',
    pin: '3345',
    avatarColor: 'from-amber-600 to-orange-700',
    category: 'permanent',
    barcode: 'GES-NT-003',
  },
  {
    id: 'nt-4',
    staffId: 'GES-NT-004',
    name: 'Mr. Kwaku Amegashie',
    role: 'Security',
    unit: 'Main Gate & Campus Security',
    phone: '+233 24 445 6789',
    phoneType: 'yam_phone',
    shift: 'Day Security (06:00 - 18:00)',
    pin: '4456',
    avatarColor: 'from-red-600 to-rose-700',
    category: 'permanent',
    barcode: 'GES-NT-004',
  },
  {
    id: 'nt-5',
    staffId: 'GES-NT-005',
    name: 'Mr. Daniel Boateng',
    role: 'Security',
    unit: 'Night Watch & Dormitory Patrol',
    phone: '+233 27 556 7890',
    phoneType: 'yam_phone',
    shift: 'Night Security (18:00 - 06:00)',
    pin: '5567',
    avatarColor: 'from-purple-600 to-slate-800',
    category: 'permanent',
    barcode: 'GES-NT-005',
  },
  {
    id: 'nt-6',
    staffId: 'GES-NT-006',
    name: 'Madam Elizabeth Mawusi Mensah',
    role: 'Matron',
    unit: 'Domestic Bursary & Dining Hall',
    phone: '+233 24 667 8901',
    phoneType: 'smartphone',
    shift: 'Morning Kitchen (05:30 - 14:00)',
    pin: '6678',
    avatarColor: 'from-pink-600 to-rose-700',
    category: 'permanent',
    barcode: 'GES-NT-006',
  },
  {
    id: 'nt-7',
    staffId: 'GES-NT-007',
    name: 'Madam Agnes Akoto',
    role: 'Cook',
    unit: 'Kitchen & Meal Preparation',
    phone: '+233 20 778 9012',
    phoneType: 'yam_phone',
    shift: 'Morning Kitchen (05:30 - 14:00)',
    pin: '7789',
    avatarColor: 'from-orange-500 to-amber-600',
    category: 'permanent',
    barcode: 'GES-NT-007',
  },
  {
    id: 'nt-8',
    staffId: 'GES-NT-008',
    name: 'Madam Comfort Abla Darko',
    role: 'Cook',
    unit: 'Kitchen & Meal Preparation',
    phone: '+233 24 889 0123',
    phoneType: 'yam_phone',
    shift: 'Morning Kitchen (05:30 - 14:00)',
    pin: '8890',
    avatarColor: 'from-amber-600 to-yellow-700',
    category: 'permanent',
    barcode: 'GES-NT-008',
  },
  {
    id: 'nt-9',
    staffId: 'GES-NT-009',
    name: 'Mr. Godwin Attipoe',
    role: 'Groundsman',
    unit: 'Sanitation, Compound & Grounds',
    phone: '+233 26 990 1234',
    phoneType: 'yam_phone',
    shift: 'Sanitation & Grounds (06:30 - 15:00)',
    pin: '9901',
    avatarColor: 'from-emerald-600 to-green-700',
    category: 'permanent',
    barcode: 'GES-NT-009',
  },
  {
    id: 'nt-10',
    staffId: 'YEA-VR-041',
    name: 'Prince Edem Tsikata',
    role: 'YEA',
    unit: 'Community Protection & Sanitation',
    phone: '+233 55 102 3456',
    phoneType: 'yam_phone',
    shift: 'Standard Duty (08:00 - 16:00)',
    pin: '1023',
    avatarColor: 'from-teal-600 to-cyan-700',
    category: 'yea',
    barcode: 'YEA-VR-041',
  },
  {
    id: 'nt-11',
    staffId: 'YEA-VR-052',
    name: 'Selorm Gbadago',
    role: 'YEA',
    unit: 'Youth Employment Agency (Temporal Security)',
    phone: '+233 54 213 4567',
    phoneType: 'yam_phone',
    shift: 'Day Security (06:00 - 18:00)',
    pin: '2134',
    avatarColor: 'from-cyan-600 to-blue-700',
    category: 'yea',
    barcode: 'YEA-VR-052',
  },
  {
    id: 'nt-12',
    staffId: 'VOL-2026-08',
    name: 'Foster Komla Dogbey',
    role: 'Volunteer',
    unit: 'Sports & Student Welfare Auxiliary',
    phone: '+233 24 324 5678',
    phoneType: 'smartphone',
    shift: 'Standard Duty (08:00 - 16:00)',
    pin: '3245',
    avatarColor: 'from-violet-600 to-purple-700',
    category: 'volunteer',
    barcode: 'VOL-2026-08',
  },
  {
    id: 'nt-13',
    staffId: 'GES-NT-013',
    name: 'Mr. John K. Nyavor',
    role: 'Driver',
    unit: 'Transport & Logistics',
    phone: '+233 24 435 6789',
    phoneType: 'yam_phone',
    shift: 'Standard Duty (08:00 - 16:00)',
    pin: '4356',
    avatarColor: 'from-slate-600 to-zinc-700',
    category: 'permanent',
    barcode: 'GES-NT-013',
  },
  {
    id: 'nt-14',
    staffId: 'GES-NT-014',
    name: 'Mr. Prosper K. Dzah',
    role: 'Lab Technician',
    unit: 'Science Laboratories (Physics / Chemistry)',
    phone: '+233 20 546 7890',
    phoneType: 'smartphone',
    shift: 'Standard Duty (08:00 - 16:00)',
    pin: '5467',
    avatarColor: 'from-indigo-600 to-blue-700',
    category: 'permanent',
    barcode: 'GES-NT-014',
  },
];

export function getInitialNonTeachingAttendance(): NonTeachingAttendanceRecord[] {
  const today = getTodayDateString();
  return [
    {
      id: 'nt-att-1',
      staffId: 'GES-NT-004',
      staffName: 'Mr. Kwaku Amegashie',
      role: 'Security',
      unit: 'Main Gate & Campus Security',
      date: today,
      clockInTime: '05:52:14',
      clockInTimestamp: Date.now() - 3.5 * 3600000,
      method: 'kiosk_touch',
      shift: 'Day Security (06:00 - 18:00)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Chief Security Post',
      synced: true,
    },
    {
      id: 'nt-att-2',
      staffId: 'GES-NT-007',
      staffName: 'Madam Agnes Akoto',
      role: 'Cook',
      unit: 'Kitchen & Meal Preparation',
      date: today,
      clockInTime: '05:25:40',
      clockInTimestamp: Date.now() - 3.8 * 3600000,
      method: 'barcode_card_scan',
      shift: 'Morning Kitchen (05:30 - 14:00)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Matron Mensah',
      synced: true,
    },
    {
      id: 'nt-att-3',
      staffId: 'GES-NT-008',
      staffName: 'Madam Comfort Abla Darko',
      role: 'Cook',
      unit: 'Kitchen & Meal Preparation',
      date: today,
      clockInTime: '05:28:11',
      clockInTimestamp: Date.now() - 3.7 * 3600000,
      method: 'pin_pad',
      shift: 'Morning Kitchen (05:30 - 14:00)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Matron Mensah',
      synced: true,
    },
    {
      id: 'nt-att-4',
      staffId: 'GES-NT-006',
      staffName: 'Madam Elizabeth Mawusi Mensah',
      role: 'Matron',
      unit: 'Domestic Bursary & Dining Hall',
      date: today,
      clockInTime: '05:40:02',
      clockInTimestamp: Date.now() - 3.6 * 3600000,
      method: 'kiosk_touch',
      shift: 'Morning Kitchen (05:30 - 14:00)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Self-Verified',
      synced: true,
    },
    {
      id: 'nt-att-5',
      staffId: 'GES-NT-001',
      staffName: 'Mr. Sylvanus K. Adzaho',
      role: 'Administrator',
      unit: 'General Administration & Records',
      date: today,
      clockInTime: '07:18:22',
      clockInTimestamp: Date.now() - 2 * 3600000,
      method: 'kiosk_touch',
      shift: 'Administration (07:30 - 16:30)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Headmaster Office',
      synced: true,
    },
    {
      id: 'nt-att-6',
      staffId: 'GES-NT-002',
      staffName: 'Mrs. Charity Dzifa Agbana',
      role: 'Bursar',
      unit: 'Bursary & Accounts Unit',
      date: today,
      clockInTime: '07:22:45',
      clockInTimestamp: Date.now() - 1.9 * 3600000,
      method: 'kiosk_touch',
      shift: 'Administration (07:30 - 16:30)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Bursary Registry',
      synced: true,
    },
    {
      id: 'nt-att-7',
      staffId: 'GES-NT-003',
      staffName: 'Mr. Isaac Tetteh Coffie',
      role: 'Storekeeper',
      unit: 'Stores, Inventory & Supplies',
      date: today,
      clockInTime: '07:44:10',
      clockInTimestamp: Date.now() - 1.5 * 3600000,
      method: 'sms_yam_phone',
      shift: 'Standard Duty (08:00 - 16:00)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Telco SMS Gateway (IN 3345)',
      synced: true,
    },
    {
      id: 'nt-att-8',
      staffId: 'YEA-VR-052',
      staffName: 'Selorm Gbadago',
      role: 'YEA',
      unit: 'Youth Employment Agency (Temporal Security)',
      date: today,
      clockInTime: '05:58:30',
      clockInTimestamp: Date.now() - 3.4 * 3600000,
      method: 'pin_pad',
      shift: 'Day Security (06:00 - 18:00)',
      punctualityStatus: 'on_time',
      verifiedBy: 'Chief Security Post',
      synced: true,
    },
  ];
}

class StorageEngine {
  public getSchoolConfig(): SchoolConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CONFIG;
  }

  public saveSchoolConfig(config: SchoolConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  public getStaff(): StaffMember[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldMockIds = parsed.some((s: StaffMember) => s.staffId && s.staffId.startsWith('GES-ST-'));
          const hasSirEugene = parsed.some((s: StaffMember) => s.staffId === '1304201');
          if (!hasOldMockIds && hasSirEugene && parsed.length >= 20) return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.saveStaff(INITIAL_STAFF);
    return INITIAL_STAFF;
  }

  public saveStaff(staff: StaffMember[]) {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }

  public addStaffMember(member: StaffMember) {
    const list = this.getStaff();
    list.unshift(member);
    this.saveStaff(list);
  }

  public getClassrooms(): Classroom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldClasses = parsed.some((c: Classroom) => c.code && c.code.startsWith('F1-SCI'));
          const hasTimetableClasses = parsed.some((c: Classroom) => c.code === 'GEN_ART_2A');
          if (!hasOldClasses && hasTimetableClasses) return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.saveClassrooms(INITIAL_CLASSROOMS);
    return INITIAL_CLASSROOMS;
  }

  public saveClassrooms(classes: Classroom[]) {
    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(classes));
  }

  public updateClassroomSession(classroomId: string, session?: Classroom['currentSession']) {
    const classes = this.getClassrooms();
    const updated = classes.map((c) => {
      if (c.id === classroomId) {
        return { ...c, currentSession: session };
      }
      return c;
    });
    this.saveClassrooms(updated);
  }

  public updateMultipleClassroomsSession(classroomIds: string[], session?: Classroom['currentSession']) {
    const classes = this.getClassrooms();
    const updated = classes.map((c) => {
      if (classroomIds.includes(c.id)) {
        return { ...c, currentSession: session };
      }
      return c;
    });
    this.saveClassrooms(updated);
  }

  public getGateAttendance(): GateAttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GATE_ATTENDANCE);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    const initial = getInitialGateAttendance();
    this.saveGateAttendance(initial);
    return initial;
  }

  public saveGateAttendance(records: GateAttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.GATE_ATTENDANCE, JSON.stringify(records));
  }

  public addGateRecord(record: GateAttendanceRecord) {
    const records = this.getGateAttendance();
    records.unshift(record);
    this.saveGateAttendance(records);
    this.queueForSync({ type: 'gate_record', payload: record });
  }

  public updateGateRecord(recordId: string, updates: Partial<GateAttendanceRecord>) {
    const records = this.getGateAttendance();
    const index = records.findIndex((r) => r.id === recordId);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      this.saveGateAttendance(records);
      this.queueForSync({ type: 'gate_record_update', payload: records[index] });
    }
  }

  public voidGateRecord(recordId: string, reason: string, adminName = 'Super Administrator'): GateAttendanceRecord | null {
    const records = this.getGateAttendance();
    const index = records.findIndex((r) => r.id === recordId);
    if (index !== -1) {
      records[index] = {
        ...records[index],
        isVoided: true,
        voidReason: reason,
        voidedAt: new Date().toISOString(),
        voidedBy: adminName,
      };
      this.saveGateAttendance(records);
      this.queueForSync({ type: 'gate_record_voided', payload: records[index] });
      return records[index];
    }
    return null;
  }

  public restoreGateRecord(recordId: string): GateAttendanceRecord | null {
    const records = this.getGateAttendance();
    const index = records.findIndex((r) => r.id === recordId);
    if (index !== -1) {
      records[index] = {
        ...records[index],
        isVoided: false,
        voidReason: undefined,
        voidedAt: undefined,
        voidedBy: undefined,
      };
      this.saveGateAttendance(records);
      this.queueForSync({ type: 'gate_record_restored', payload: records[index] });
      return records[index];
    }
    return null;
  }

  public getPeriodSessions(): PeriodTeachingSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERIOD_SESSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    const initial = getInitialTeachingSessions();
    this.savePeriodSessions(initial);
    return initial;
  }

  public savePeriodSessions(sessions: PeriodTeachingSession[]) {
    localStorage.setItem(STORAGE_KEYS.PERIOD_SESSIONS, JSON.stringify(sessions));
  }

  public addPeriodSession(session: PeriodTeachingSession) {
    const list = this.getPeriodSessions();
    list.unshift(session);
    this.savePeriodSessions(list);
    this.queueForSync({ type: 'period_session', payload: session });
  }

  public queueForSync(item: { type: string; payload: unknown }) {
    try {
      const queue = this.getSyncQueue();
      queue.push({ ...item, queuedAt: Date.now() });
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error(e);
    }
  }

  public getSyncQueue(): Array<{ type: string; payload: unknown; queuedAt: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  public clearSyncQueue() {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(Date.now()));
  }

  public getLastSyncTime(): string {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!raw) return 'Just now';
    const elapsed = Math.round((Date.now() - Number(raw)) / 60000);
    if (elapsed < 1) return 'Just now';
    return `${elapsed}m ago`;
  }

  public getDeviceMode(): 'kiosk' | 'byod' {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.DEVICE_MODE);
      if (mode === 'kiosk' || mode === 'byod') return mode;
    } catch (e) {
      console.error(e);
    }
    return 'kiosk'; // Default to mounted Kiosk terminal
  }

  public saveDeviceMode(mode: 'kiosk' | 'byod') {
    localStorage.setItem(STORAGE_KEYS.DEVICE_MODE, mode);
  }

  public getBoundStaffId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.BOUND_STAFF_ID) || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  public saveBoundStaffId(staffId: string | null) {
    if (staffId) {
      localStorage.setItem(STORAGE_KEYS.BOUND_STAFF_ID, staffId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.BOUND_STAFF_ID);
    }
  }

  public getNonTeachingStaff(): NonTeachingStaffMember[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NON_TEACHING_STAFF);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    this.saveNonTeachingStaff(INITIAL_NON_TEACHING_STAFF);
    return INITIAL_NON_TEACHING_STAFF;
  }

  public saveNonTeachingStaff(staff: NonTeachingStaffMember[]) {
    localStorage.setItem(STORAGE_KEYS.NON_TEACHING_STAFF, JSON.stringify(staff));
  }

  public addNonTeachingStaff(member: NonTeachingStaffMember) {
    const list = this.getNonTeachingStaff();
    list.unshift(member);
    this.saveNonTeachingStaff(list);
  }

  public getNonTeachingAttendance(): NonTeachingAttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NON_TEACHING_ATTENDANCE);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    const initial = getInitialNonTeachingAttendance();
    this.saveNonTeachingAttendance(initial);
    return initial;
  }

  public saveNonTeachingAttendance(records: NonTeachingAttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.NON_TEACHING_ATTENDANCE, JSON.stringify(records));
  }

  public addNonTeachingRecord(record: NonTeachingAttendanceRecord) {
    const list = this.getNonTeachingAttendance();
    const existingIdx = list.findIndex(
      (r) => r.staffId === record.staffId && r.date === record.date
    );
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }
    this.saveNonTeachingAttendance(list);
    this.queueForSync({ type: 'non_teaching_attendance', payload: record });
  }

  public updateNonTeachingRecord(id: string, updates: Partial<NonTeachingAttendanceRecord>) {
    const list = this.getNonTeachingAttendance();
    const idx = list.findIndex((r) => r.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      this.saveNonTeachingAttendance(list);
      this.queueForSync({ type: 'non_teaching_attendance_update', payload: list[idx] });
    }
  }

  public voidNonTeachingRecord(recordId: string, reason: string, adminName = 'Super Administrator'): NonTeachingAttendanceRecord | null {
    const list = this.getNonTeachingAttendance();
    const idx = list.findIndex((r) => r.id === recordId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        isVoided: true,
        voidReason: reason,
        voidedAt: new Date().toISOString(),
        voidedBy: adminName,
      };
      this.saveNonTeachingAttendance(list);
      this.queueForSync({ type: 'non_teaching_record_voided', payload: list[idx] });
      return list[idx];
    }
    return null;
  }

  public restoreNonTeachingRecord(recordId: string): NonTeachingAttendanceRecord | null {
    const list = this.getNonTeachingAttendance();
    const idx = list.findIndex((r) => r.id === recordId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        isVoided: false,
        voidReason: undefined,
        voidedAt: undefined,
        voidedBy: undefined,
      };
      this.saveNonTeachingAttendance(list);
      this.queueForSync({ type: 'non_teaching_record_restored', payload: list[idx] });
      return list[idx];
    }
    return null;
  }

  public resetAllToDemo() {
    this.saveSchoolConfig(DEFAULT_CONFIG);
    this.saveStaff(INITIAL_STAFF);
    this.saveClassrooms(INITIAL_CLASSROOMS);
    this.saveGateAttendance(getInitialGateAttendance());
    this.savePeriodSessions(getInitialTeachingSessions());
    this.saveNonTeachingStaff(INITIAL_NON_TEACHING_STAFF);
    this.saveNonTeachingAttendance(getInitialNonTeachingAttendance());
    this.clearSyncQueue();
  }
}

export const storageEngine = new StorageEngine();
