import { Week } from '../types';

export const SAMPLE_DECKS: Omit<Week, 'id' | 'createdAt'>[] = [
  {
    title: 'Week 1: The Solar System & Celestial Mechanics',
    unitTitle: 'Unit 1: Earth & Space Sciences',
    targetCulminatingDate: 'Oct 24, 2026',
    status: 'published',
    slideText: `[Slide 1] Overview of the Solar System: 8 planets, asteroid belt between Mars and Jupiter, Kuiper belt beyond Neptune. Terrestrial vs Gas/Ice Giants.
[Slide 2] Kepler's Three Laws of Planetary Motion: 1st Law (Elliptical orbits with Sun at one focus), 2nd Law (Equal areas in equal time intervals - planets speed up at perihelion), 3rd Law (Harmonic law: P squared equals a cubed).
[Slide 3] Gravity and Orbital Velocity: Newton's universal law of gravitation F = G*(m1*m2)/r^2. Escape velocity vs orbital velocity.
[Slide 4] Terrestrial Planets: Mercury (no atmosphere, extreme temperatures), Venus (thick CO2 atmosphere, runaway greenhouse effect, retrograde rotation), Earth (liquid water, nitrogen-oxygen atmosphere), Mars (thin atmosphere, iron oxide soil, Olympus Mons).
[Slide 5] Jovian Giants: Jupiter (Great Red Spot, 79+ moons, metallic hydrogen core), Saturn (prominent ring system made of ice and rock particles, low density).
[Slide 6] Ice Giants: Uranus (extreme 98-degree axial tilt, methane absorption gives cyan tint), Neptune (fastest supersonic winds in solar system, Great Dark Spot, Triton moon).
[Slide 7] Minor Bodies & The Kuiper Belt: Ceres in asteroid belt, Pluto and Eris in Kuiper Belt, Oort cloud as theoretical origin of long-period comets.
[Slide 8] Tidal Forces & Lunar Interactions: Synchronous rotation of Earth's Moon, spring tides during new/full moons, neap tides during quarter moons.`,
    quiz: [
      {
        id: 'q1',
        question: "According to Kepler's First Law, what geometric shape do planetary orbits trace around the Sun?",
        options: ['A perfect circle with the Sun at the center', 'An ellipse with the Sun at one focus', 'A parabola with variable focal points', 'A hyperbola with two foci'],
        correctIndex: 1,
        explanation: "Kepler's First Law states that all planets move about the Sun in elliptical orbits, having the Sun as one of the foci."
      },
      {
        id: 'q2',
        question: "What happens to a planet's orbital speed as it reaches perihelion (its closest approach to the Sun)?",
        options: ['It decelerates to its lowest speed', 'It stops temporarily to reverse direction', 'It accelerates to its highest orbital speed', 'It maintains an unvarying speed throughout'],
        correctIndex: 2,
        explanation: "By Kepler's Second Law (Law of Equal Areas), planets sweep equal areas in equal times, moving fastest at perihelion."
      },
      {
        id: 'q3',
        question: 'Which gas is predominantly responsible for the runaway greenhouse effect on Venus?',
        options: ['Methane (CH4)', 'Carbon Dioxide (CO2)', 'Water Vapor (H2O)', 'Sulfur Dioxide (SO2)'],
        correctIndex: 1,
        explanation: "Venus's atmosphere is over 96% Carbon Dioxide, trapping heat and creating surface temperatures exceeding 460°C."
      },
      {
        id: 'q4',
        question: 'Where is the main Asteroid Belt situated in our solar system?',
        options: ['Between Earth and Mars', 'Between Mars and Jupiter', 'Between Saturn and Uranus', 'Beyond Neptune in the Kuiper Belt'],
        correctIndex: 1,
        explanation: 'The main Asteroid Belt is located in the region between the orbits of Mars and Jupiter.'
      },
      {
        id: 'q5',
        question: 'What gives Uranus and Neptune their characteristic blue and cyan coloration?',
        options: ['Liquid water oceans', 'Atmospheric methane absorbing red wavelengths', 'Solid nitrogen frost crystals', 'High concentrations of ozone'],
        correctIndex: 1,
        explanation: 'Methane in their upper atmospheres absorbs red light and reflects blue-green light.'
      },
      {
        id: 'q6',
        question: 'What is unique about the rotational axis of Uranus?',
        options: ['It has zero axial tilt and stands completely upright', 'It rotates at twice the speed of its orbit', 'It is tilted almost 98 degrees, effectively spinning on its side', 'It flips orientation every 11 Earth years'],
        correctIndex: 2,
        explanation: "Uranus has an extreme tilt of approximately 97.8 degrees, causing dramatic seasonal variations."
      },
      {
        id: 'q7',
        question: 'What celestial phenomenon occurs when the Sun, Earth, and Moon align during a Full or New Moon?',
        options: ['Neap tides with minimal tidal variation', 'Spring tides with highest tidal range', 'Tidal locking reversal', 'Orbital decay of the lunar path'],
        correctIndex: 1,
        explanation: 'Spring tides occur during New and Full moons when gravitational forces of the Moon and Sun reinforce each other.'
      },
      {
        id: 'q8',
        question: 'Which is the largest volcano and shield mountain in the Solar System?',
        options: ['Mauna Kea on Earth', 'Olympus Mons on Mars', 'Maxwell Montes on Venus', 'Io Volcano on Jupiter'],
        correctIndex: 1,
        explanation: 'Olympus Mons on Mars stands about 22 km (nearly 3 times the height of Mt Everest).'
      },
      {
        id: 'q9',
        question: "In Newton's Law of Universal Gravitation, if the distance between two masses is doubled, how does the gravitational force change?",
        options: ['It is cut in half', 'It is reduced to one-fourth (1/4)', 'It doubles', 'It remains completely unchanged'],
        correctIndex: 1,
        explanation: 'Gravity follows the inverse-square law; doubling distance r results in 1/(2^2) = 1/4 the force.'
      },
      {
        id: 'q10',
        question: 'What is the theoretical spherical reservoir of icy planetesimals and comets surrounding our solar system?',
        options: ['The Kuiper Belt', 'The Asteroid Belt', 'The Oort Cloud', 'The Van Allen Belt'],
        correctIndex: 2,
        explanation: 'The Oort cloud is the distant spherical shell believed to surround the entire solar system.'
      },
      {
        id: 'q11',
        question: 'Why does Saturn have an overall density less than liquid water (0.687 g/cm³)?',
        options: ['Its interior is mostly hollow', 'It is primarily composed of light hydrogen and helium gases', 'Its rings generate strong buoyant lift', 'It is made of low-density porous rocks'],
        correctIndex: 1,
        explanation: 'Saturn is composed almost entirely of lightweight hydrogen and helium gases.'
      },
      {
        id: 'q12',
        question: 'Which moon of Jupiter is the most volcanically active body in the Solar System?',
        options: ['Europa', 'Io', 'Ganymede', 'Callisto'],
        correctIndex: 1,
        explanation: 'Tidal flexing from Jupiter causes immense internal heating on Io, driving hundreds of active volcanoes.'
      },
      {
        id: 'q13',
        question: "What is the primary factor that causes Earth's Moon to always show the same face toward Earth?",
        options: ['Synchronous rotation (tidal locking)', 'Atmospheric drag', 'Magnetic dipole alignment', 'Solar radiation pressure'],
        correctIndex: 0,
        explanation: "The Moon rotates on its axis in the exact same time it takes to orbit Earth (27.3 days)."
      },
      {
        id: 'q14',
        question: 'Which planet possesses the Great Red Spot, a giant anticyclonic storm larger than Earth?',
        options: ['Saturn', 'Jupiter', 'Neptune', 'Mars'],
        correctIndex: 1,
        explanation: "Jupiter's Great Red Spot is a persistent high-pressure storm that has raged for centuries."
      },
      {
        id: 'q15',
        question: 'What is the region beyond Neptune populated by small icy bodies, including Pluto and Haumea?',
        options: ['The Main Asteroid Belt', 'The Kuiper Belt', 'The Trojan Belt', 'The Heliosphere Ring'],
        correctIndex: 1,
        explanation: 'The Kuiper Belt is the disc-shaped region beyond Neptune hosting dwarf planets and icy debris.'
      },
      {
        id: 'q16',
        question: "What does Kepler's Third Law (P² = a³) relate to one another?",
        options: ['Orbital period and average semi-major axis distance', 'Planetary mass and surface gravity', 'Rotational speed and axial tilt', 'Escape velocity and atmospheric density'],
        correctIndex: 0,
        explanation: 'Kepler’s Third Law mathematically links a planet’s orbital period (P) to its average distance from the Sun (a).'
      },
      {
        id: 'q17',
        question: 'Why does Mercury experience extreme temperature fluctuations between -180°C at night and 430°C during the day?',
        options: ['Its elliptical orbit brings it inside the Sun', 'It has virtually no atmosphere to insulate heat', 'Its core produces intermittent nuclear reactions', 'Its surface is covered with molten sulfur'],
        correctIndex: 1,
        explanation: 'Without a substantial atmosphere to distribute or retain heat, daytime heat dissipates immediately into space at night.'
      },
      {
        id: 'q18',
        question: 'What is the primary composition of Saturn’s rings?',
        options: ['Solid iron-nickel sheets', 'Billions of water ice particles, rocks, and dust', 'Frozen carbon dioxide blocks', 'Ionized plasma streams'],
        correctIndex: 1,
        explanation: 'Saturn’s rings are over 99% pure water ice particles ranging in size from micrometers to meters.'
      },
      {
        id: 'q19',
        question: 'Which Jovian moon harbors a global subsurface liquid water ocean beneath its icy crust, making it a prime candidate for astrobiology?',
        options: ['Io', 'Europa', 'Titan', 'Phobos'],
        correctIndex: 1,
        explanation: 'Europa possesses a smooth ice crust above a deep global ocean warmed by tidal energy.'
      },
      {
        id: 'q20',
        question: 'What is the term for the velocity required for an object to permanently break free from a planet’s gravitational attraction?',
        options: ['Terminal velocity', 'Orbital velocity', 'Escape velocity', 'Mach speed'],
        correctIndex: 2,
        explanation: 'Escape velocity is the minimum speed needed for a non-propelled body to escape the gravitational influence of a primary body.'
      }
    ]
  },
  {
    title: 'Week 2: The American Revolution & Constitutional Foundations',
    unitTitle: 'Unit 2: US History & Governance',
    targetCulminatingDate: 'Nov 12, 2026',
    status: 'published',
    slideText: `[Slide 1] Causes of the Revolution: French and Indian War debt, Stamp Act (1765), Boston Massacre (1770), Boston Tea Party (1773), Intolerable Acts (1774).
[Slide 2] Ideological Roots: John Locke's natural rights (life, liberty, property), social contract theory, Thomas Paine's Common Sense (1776).
[Slide 3] The Declaration of Independence (1776): Drafted by Thomas Jefferson, grievance against King George III, consent of the governed.
[Slide 4] Revolutionary War Milestones: Lexington & Concord ("shot heard 'round the world"), Battle of Saratoga (turning point securing French alliance), Winter at Valley Forge, Battle of Yorktown (Cornwallis surrenders in 1781).
[Slide 5] Articles of Confederation (1781): Weak central government, unicameral congress, no executive or judicial branches, couldn't levy taxes, Shays' Rebellion exposes fragility.
[Slide 6] The Constitutional Convention (1787): Great Compromise (bicameral legislature: Senate and House), Three-Fifths Compromise, Separation of Powers & Checks and Balances.
[Slide 7] Ratification Debate: Federalists (Hamilton, Madison, Jay - Federalist Papers) vs Anti-Federalists (Patrick Henry, demanding Bill of Rights).`,
    quiz: [
      {
        id: 'h1',
        question: 'What phrase was coined following the Stamp Act to protest taxation by a parliament where colonists had no voice?',
        options: ['Liberty or Death', 'No Taxation Without Representation', 'E Pluribus Unum', 'Don’t Tread on Me'],
        correctIndex: 1,
        explanation: 'Colonists argued that being taxed without direct delegates in British Parliament infringed their rights.'
      },
      {
        id: 'h2',
        question: 'Which Enlightenment philosopher deeply influenced Thomas Jefferson’s ideas on natural rights in the Declaration of Independence?',
        options: ['Thomas Hobbes', 'John Locke', 'Voltaire', 'Jean-Jacques Rousseau'],
        correctIndex: 1,
        explanation: 'John Locke’s theories on natural rights (life, liberty, property) and the social contract were directly referenced.'
      },
      {
        id: 'h3',
        question: 'Which 1777 battle is widely regarded as the decisive turning point of the Revolutionary War because it convinced France to openly ally with America?',
        options: ['Battle of Bunker Hill', 'Battle of Saratoga', 'Battle of Trenton', 'Battle of Yorktown'],
        correctIndex: 1,
        explanation: 'The American victory at Saratoga demonstrated that the colonists could win major pitched battles, prompting France to sign a formal alliance.'
      },
      {
        id: 'h4',
        question: "What major weakness of the Articles of Confederation was highlighted by Shays' Rebellion in 1786?",
        options: ['The national government lacked the power to collect taxes or maintain a standing army to ensure stability', 'The President held excessive unilateral executive power', 'The Supreme Court frequently nullified state trade laws', 'The federal government issued too much uniform paper currency'],
        correctIndex: 0,
        explanation: "The Articles created a weak central government that couldn't tax, enforce laws, or quickly put down armed domestic rebellions."
      },
      {
        id: 'h5',
        question: 'How did the Great Compromise (Connecticut Compromise) resolve the dispute over legislative representation between large and small states?',
        options: ['By establishing a single house where every state receives two votes', 'By creating a bicameral legislature: proportional in the House and equal in the Senate', 'By allowing the President to appoint representatives', 'By basing all legislative seats exclusively on land area'],
        correctIndex: 1,
        explanation: 'It merged the Virginia and New Jersey Plans into a two-house Congress (House of Representatives based on population, Senate equal with 2 per state).'
      },
      {
        id: 'h6',
        question: 'What influential pamphlet written by Thomas Paine in January 1776 made a compelling moral and political argument for complete American independence?',
        options: ['The Federalist Papers', 'Common Sense', 'The Rights of Man', 'Letters from a Pennsylvania Farmer'],
        correctIndex: 1,
        explanation: 'Common Sense mobilized broad public support across all colonial classes for declaring independence from Great Britain.'
      },
      {
        id: 'h7',
        question: 'Where did British General Cornwallis surrender his entire army in October 1781, ending major fighting in the American colonies?',
        options: ['Boston', 'Philadelphia', 'Yorktown', 'Charleston'],
        correctIndex: 2,
        explanation: 'Surrounded by French naval forces and joint Franco-American land troops under Washington, Cornwallis surrendered at Yorktown, Virginia.'
      },
      {
        id: 'h8',
        question: 'What was the primary demand of the Anti-Federalists before they agreed to ratify the newly drafted United States Constitution?',
        options: ['The immediate abolition of the Senate', 'The addition of a Bill of Rights guaranteeing individual liberties', 'A provision establishing lifetime terms for governors', 'Moving the national capital to Boston'],
        correctIndex: 1,
        explanation: 'Anti-Federalists feared federal overreach and insisted on the first ten amendments (Bill of Rights) to protect personal freedoms.'
      },
      {
        id: 'h9',
        question: 'Which of the following serves as an example of the constitutional system of Checks and Balances?',
        options: ['The President vetoing a bill passed by Congress', 'State governors enacting state laws', 'Citizens voting in local elections', 'The postal service delivering mail across state borders'],
        correctIndex: 0,
        explanation: 'A presidential veto checks legislative power; Congress can in turn override the veto with a two-thirds majority in both chambers.'
      },
      {
        id: 'h10',
        question: 'What was the controversial Three-Fifths Compromise adopted at the 1787 Constitutional Convention?',
        options: ['Three-fifths of all states had to approve new treaties', 'Three out of every five enslaved persons were counted for taxation and congressional representation', 'Three-fifths of Supreme Court justices must be chosen by Congress', 'Federal taxes required a 60% supermajority in the Senate'],
        correctIndex: 1,
        explanation: 'It counted three-fifths of enslaved individuals toward state population totals for House seats and direct taxation.'
      },
      {
        id: 'h11',
        question: 'Which trio authored the series of 85 essays known as The Federalist Papers under the pseudonym "Publius"?',
        options: ['Thomas Jefferson, John Adams, Benjamin Franklin', 'Alexander Hamilton, James Madison, John Jay', 'George Washington, Patrick Henry, Samuel Adams', 'John Hancock, Paul Revere, Thomas Paine'],
        correctIndex: 1,
        explanation: 'Hamilton, Madison, and Jay wrote The Federalist Papers to advocate for the ratification of the Constitution in New York.'
      },
      {
        id: 'h12',
        question: 'What 1770 confrontation in Boston resulted in British soldiers firing into a crowd, killing five colonists including Crispus Attucks?',
        options: ['The Boston Massacre', 'The Boston Tea Party', 'The Battle of Bunker Hill', 'The Gaspee Affair'],
        correctIndex: 0,
        explanation: 'The Boston Massacre intensified anti-British sentiment through widely circulated engravings and patriot speeches.'
      },
      {
        id: 'h13',
        question: 'What harsh punitive measures were enacted by the British Parliament in 1774 in direct response to the Boston Tea Party?',
        options: ['The Stamp Act', 'The Coercive (Intolerable) Acts', 'The Navigation Acts', 'The Declaratory Act'],
        correctIndex: 1,
        explanation: 'The Coercive Acts closed Boston Harbor, suspended the Massachusetts legislature, and imposed the Quartering Act.'
      },
      {
        id: 'h14',
        question: 'Where did the Continental Army endure severe deprivation, harsh winter conditions, and grueling professional drill training under Baron von Steuben in 1777–1778?',
        options: ['Valley Forge, Pennsylvania', 'Trenton, New Jersey', 'Saratoga, New York', 'Richmond, Virginia'],
        correctIndex: 0,
        explanation: 'At Valley Forge, Washington kept the army together while transforming them into a disciplined, effective fighting force.'
      },
      {
        id: 'h15',
        question: 'Under the U.S. Constitution, which branch of the federal government has the enumerated constitutional power to declare war?',
        options: ['The Executive Branch (The President)', 'The Legislative Branch (The Congress)', 'The Judicial Branch (The Supreme Court)', 'The Joint Chiefs of Staff'],
        correctIndex: 1,
        explanation: 'Article I, Section 8 grants Congress the explicit authority to declare war, raise and support armies, and maintain a navy.'
      },
      {
        id: 'h16',
        question: 'What formal treaty in 1783 officially concluded the Revolutionary War and recognized American independence from Great Britain?',
        options: ['Treaty of Ghent', 'Treaty of Paris (1783)', 'Treaty of Versailles', 'Treaty of Utrecht'],
        correctIndex: 1,
        explanation: 'The Treaty of Paris recognized American sovereignty and established borders extending westward to the Mississippi River.'
      },
      {
        id: 'h17',
        question: 'Who is recognized as the "Father of the Constitution" for his extensive preparatory research and primary authorship of the Virginia Plan?',
        options: ['George Washington', 'Benjamin Franklin', 'James Madison', 'Alexander Hamilton'],
        correctIndex: 2,
        explanation: 'James Madison drafted the Virginia Plan, took meticulous notes of convention debates, and authored key Federalist essays.'
      },
      {
        id: 'h18',
        question: 'What first battle of the American Revolution took place in Massachusetts in April 1775 when British troops marched to seize colonial munitions?',
        options: ['Battles of Lexington and Concord', 'Battle of Long Island', 'Battle of Monmouth', 'Battle of Brandywine'],
        correctIndex: 0,
        explanation: 'Minutemen confronted British regulars at Lexington and the Old North Bridge in Concord, firing the "shot heard round the world."'
      },
      {
        id: 'h19',
        question: 'What fundamental democratic principle states that the government derives its legitimate authority solely from the will and consent of the citizens?',
        options: ['Divine Right of Kings', 'Popular Sovereignty', 'Judicial Review', 'Federal Supremacy'],
        correctIndex: 1,
        explanation: 'Popular Sovereignty posits that ultimate political power resides with the people through elected representatives.'
      },
      {
        id: 'h20',
        question: 'Which constitutional amendment in the Bill of Rights protects citizens against unreasonable searches and seizures of their persons, houses, and papers?',
        options: ['First Amendment', 'Second Amendment', 'Fourth Amendment', 'Eighth Amendment'],
        correctIndex: 2,
        explanation: 'The Fourth Amendment requires warrants based on probable cause for government searches and seizures.'
      }
    ]
  }
];
