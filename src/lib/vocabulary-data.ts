// Vocabulary terms data for search functionality
export interface VocabularyTerm {
  finnish: string;
  english: string;
  section: string;
  slug: string;
  description: string;
}

export const vocabularyTerms: VocabularyTerm[] = [
  // A-C
  { finnish: 'Abduktio', english: 'Abduction', section: 'A–C', slug: 'a-c', description: 'Päättely parhaaseen selitykseen' },
  { finnish: 'Abstraktio', english: 'Abstraction', section: 'A–C', slug: 'a-c', description: 'Ei-materiaaliset entiteetit tai mentaalinen operaatio' },
  { finnish: 'Adaptaatio', english: 'Adaptation', section: 'A–C', slug: 'a-c', description: 'Evoluution kautta kehittyneet piirteet' },
  { finnish: 'Ajattelu', english: 'Thinking', section: 'A–C', slug: 'a-c', description: 'Korkeammat kognitiiviset toiminnot' },
  { finnish: 'Ajatuskoe', english: 'Thought Experiment', section: 'A–C', slug: 'a-c', description: 'Filosofinen ja tieteellinen menetelmä' },
  { finnish: 'Algoritmi', english: 'Algorithm', section: 'A–C', slug: 'a-c', description: 'Vaiheittaiset symbolisen manipulaation säännöt' },
  { finnish: 'Analyyttinen totuus', english: 'Analytic Truth', section: 'A–C', slug: 'a-c', description: 'Totuus, joka riippuu vain sanojen merkityksistä' },
  { finnish: 'Synteettinen totuus', english: 'Synthetic Truth', section: 'A–C', slug: 'a-c', description: 'Totuus, joka vaatii ulkoisten tosiasioiden todentamista' },
  { finnish: 'Anatomia', english: 'Anatomy', section: 'A–C', slug: 'a-c', description: 'Organismien rakenteen tutkimus' },
  { finnish: 'Apriorinen tieto', english: 'A Priori Knowledge', section: 'A–C', slug: 'a-c', description: 'Tieto, joka ei riipu havainnoista' },
  { finnish: 'Aposteriorinen tieto', english: 'A Posteriori Knowledge', section: 'A–C', slug: 'a-c', description: 'Kokemukseen perustuva tieto' },
  { finnish: 'Argumentti', english: 'Argument', section: 'A–C', slug: 'a-c', description: 'Päättelyketju tai propositiojoukko' },
  { finnish: 'Arkipsykologia', english: 'Folk Psychology', section: 'A–C', slug: 'a-c', description: 'Arkijärkeen perustuva käyttäytymisen selitys' },
  { finnish: 'Assosiaatio', english: 'Association', section: 'A–C', slug: 'a-c', description: 'Yhteys kahden merkityksellisen asian välillä' },
  { finnish: 'Behaviorismi', english: 'Behaviorism', section: 'A–C', slug: 'a-c', description: 'Objektiivisiin havaintoihin perustuva psykologia' },
  { finnish: 'Biologia', english: 'Biology', section: 'A–C', slug: 'a-c', description: 'Organismeja tutkiva luonnontiede' },

  // D-F
  { finnish: 'Deduktio', english: 'Deduction', section: 'D–F', slug: 'd-f', description: 'Loogisesti sitova päättely' },
  { finnish: 'Dualismi', english: 'Dualism', section: 'D–F', slug: 'd-f', description: 'Mentaalisten ja materiaalisten substanssien teoria' },
  { finnish: 'Ehdollistuminen', english: 'Conditioning', section: 'D–F', slug: 'd-f', description: 'Käyttäytymisen oppiminen' },
  { finnish: 'Eliminativismi', english: 'Eliminativism', section: 'D–F', slug: 'd-f', description: 'Radikaali materialismin muoto' },
  { finnish: 'Empiirinen menetelmä', english: 'Empirical Method', section: 'D–F', slug: 'd-f', description: 'Havaintoihin perustuva tieteellinen menetelmä' },
  { finnish: 'Ekologia', english: 'Ecology', section: 'D–F', slug: 'd-f', description: 'Organismien ja ympäristön vuorovaikutus' },
  { finnish: 'Emootiot', english: 'Emotions', section: 'D–F', slug: 'd-f', description: 'Affektiiviset psykologiset ilmiöt' },
  { finnish: 'Empirismi', english: 'Empiricism', section: 'D–F', slug: 'd-f', description: 'Havaintoihin perustuva filosofia' },
  { finnish: 'Epifenomenalismi', english: 'Epiphenomenalism', section: 'D–F', slug: 'd-f', description: 'Mentaaliset tilat aivojen sivutuotteina' },
  { finnish: 'Epistemologia', english: 'Epistemology', section: 'D–F', slug: 'd-f', description: 'Tietoteoria' },
  { finnish: 'Etologia', english: 'Ethology', section: 'D–F', slug: 'd-f', description: 'Eläinten käyttäytymisen tutkimus' },
  { finnish: 'Evoluutio', english: 'Evolution', section: 'D–F', slug: 'd-f', description: 'Lajien muutos luonnonvalinnan kautta' },
  { finnish: 'Fenomenaaliset ominaisuudet', english: 'Phenomenal Properties', section: 'D–F', slug: 'd-f', description: 'Subjektiiviset kokemukselliset laadut' },
  { finnish: 'Fenotyyppi', english: 'Phenotype', section: 'D–F', slug: 'd-f', description: 'Yksilön havaittavat ominaisuudet' },
  { finnish: 'Funktionalismi', english: 'Functionalism', section: 'D–F', slug: 'd-f', description: 'Mentaaliset tilat funktionaalisten suhteiden kautta' },
  { finnish: 'Fysiikka', english: 'Physics', section: 'D–F', slug: 'd-f', description: 'Aineen käyttäytymislakien tutkimus' },
  { finnish: 'Fysiologia', english: 'Physiology', section: 'D–F', slug: 'd-f', description: 'Biologisten mekanismien tutkimus' },
  { finnish: 'Fysikaalisen symbolijärjestelmän hypoteesi', english: 'Physical Symbol System Hypothesis', section: 'D–F', slug: 'd-f', description: 'Vahva tekoäly -teoria' },

  // G-I
  { finnish: 'Geeni', english: 'Gene', section: 'G–I', slug: 'g-i', description: 'DNA-järjestelmä, joka säätelee kehitystä' },
  { finnish: 'Genetiikka', english: 'Genetics', section: 'G–I', slug: 'g-i', description: 'Perinnöllisyyden tutkimus' },
  { finnish: 'Havainto', english: 'Perception', section: 'G–I', slug: 'g-i', description: 'Sensorinen representaatio ympäristöstä' },
  { finnish: 'Holismi', english: 'Holism', section: 'G–I', slug: 'g-i', description: 'Kokonaisuuden ensisijaisuus' },
  { finnish: 'Humanistiset tieteet', english: 'Humanities', section: 'G–I', slug: 'g-i', description: 'Ihmistä merkityksellisinä kokemuksina tutkivat tieteet' },
  { finnish: 'Hypoteesi', english: 'Hypothesis', section: 'G–I', slug: 'g-i', description: 'Testattava oletus' },
  { finnish: 'Implementaatio', english: 'Implementation', section: 'G–I', slug: 'g-i', description: 'Toteutus alemmalla tasolla' },
  { finnish: 'Induktio', english: 'Induction', section: 'G–I', slug: 'g-i', description: 'Yleistävä päättely' },
  { finnish: 'Intentionaalisuus', english: 'Intentionality', section: 'G–I', slug: 'g-i', description: 'Mentaalisten tilojen suuntautuneisuus' },
  { finnish: 'Introspektionismi', english: 'Introspectionism', section: 'G–I', slug: 'g-i', description: 'Introspektioon perustuva psykologia' },
  { finnish: 'Itseänkorjaavuus', english: 'Self-Correction', section: 'G–I', slug: 'g-i', description: 'Tieteellisen menetelmän korjaavuus' },

  // J-L
  { finnish: 'Kansanpsykologia', english: 'Folk Psychology', section: 'J–L', slug: 'j-l', description: 'Arkijärkeen perustuva käyttäytymisen selitys' },
  { finnish: 'Kausaliteetti', english: 'Causality', section: 'J–L', slug: 'j-l', description: 'Syy-seuraus-suhteet' },
  { finnish: 'Kieli', english: 'Language', section: 'J–L', slug: 'j-l', description: 'Ihmisen kielikyky ja symbolijärjestelmät' },
  { finnish: 'Kielitiede', english: 'Linguistics', section: 'J–L', slug: 'j-l', description: 'Kielen tutkimus' },
  { finnish: 'Kognitio', english: 'Cognition', section: 'J–L', slug: 'j-l', description: 'Informaation prosessointi' },
  { finnish: 'Kognitiotiede', english: 'Cognitive Science', section: 'J–L', slug: 'j-l', description: 'Informaatiota käsittelevien järjestelmien tutkimus' },
  { finnish: 'Kognitiivinen arkkitehtuuri', english: 'Cognitive Architecture', section: 'J–L', slug: 'j-l', description: 'Kognitiivisten komputaatioiden rakenne' },
  { finnish: 'Kognitiivinen psykologia', english: 'Cognitive Psychology', section: 'J–L', slug: 'j-l', description: 'Tietoon liittyvien ilmiöiden tutkimus' },
  { finnish: 'Klassinen kognitiotiede', english: 'Classical Cognitive Science', section: 'J–L', slug: 'j-l', description: 'Komputationaaliseen hypoteesiin perustuva kognitiotiede' },
  { finnish: 'Kognitivismi', english: 'Cognitivism', section: 'J–L', slug: 'j-l', description: 'Sisäisten informaatiojärjestelmien teoria' },
  { finnish: 'Kokeellinen tutkimus', english: 'Experimental Research', section: 'J–L', slug: 'j-l', description: 'Muuttujien manipulointiin perustuva tutkimus' },
  { finnish: 'Kompositionaalisuus', english: 'Compositionality', section: 'J–L', slug: 'j-l', description: 'Merkityksen rakentuminen osista' },
  { finnish: 'Komputaatio', english: 'Computation', section: 'J–L', slug: 'j-l', description: 'Mekaaninen tai representationaalinen laskenta' },
  { finnish: 'Komputationalismi', english: 'Computationalism', section: 'J–L', slug: 'j-l', description: 'Mieli komputationaalisena järjestelmänä' },
  { finnish: 'Konnektionismi', english: 'Connectionism', section: 'J–L', slug: 'j-l', description: 'Neuroverkkoihin perustuva mallintaminen' },
  { finnish: 'Konstituentti', english: 'Constituent', section: 'J–L', slug: 'j-l', description: 'Rakenteellinen komponentti' },
  { finnish: 'Kvaliat', english: 'Qualia', section: 'J–L', slug: 'j-l', description: 'Subjektiiviset fenomenaaliset sisällöt' },
  { finnish: 'Käsite', english: 'Concept', section: 'J–L', slug: 'j-l', description: 'Ajattelun perusyksikkö' },
  { finnish: 'Logiikka', english: 'Logic', section: 'J–L', slug: 'j-l', description: 'Rationaalisen päättelyn tutkimus' },
  { finnish: 'Lingvistiikka', english: 'Linguistics', section: 'J–L', slug: 'j-l', description: 'Kielen tieteellinen tutkimus' },
  { finnish: 'Lokalisaatio', english: 'Localization', section: 'J–L', slug: 'j-l', description: 'Kognitiivisen toiminnan aivopaikannnus' },
  { finnish: 'Looginen behaviorismi', english: 'Logical Behaviorism', section: 'J–L', slug: 'j-l', description: 'Mentaalisten termien kääntäminen käyttäytymistermeihin' },
  { finnish: 'Luonnontiede', english: 'Natural Science', section: 'J–L', slug: 'j-l', description: 'Luonnonilmiöiden empiirinen tutkimus' },
  { finnish: 'Luonnonvalinta', english: 'Natural Selection', section: 'J–L', slug: 'j-l', description: 'Evoluution mekanismi' },

  // M-O
  { finnish: 'Marrin tasot', english: "Marr's Levels", section: 'M–O', slug: 'm-o', description: 'Kolmitasoinen analyysi' },
  { finnish: 'Materialismi', english: 'Materialism', section: 'M–O', slug: 'm-o', description: 'Kaikki olemassa oleva on ainetta' },
  { finnish: 'Mekanismi', english: 'Mechanism', section: 'M–O', slug: 'm-o', description: 'Järjestelmä, joka koostuu vuorovaikuttavista osista' },
  { finnish: 'Menetelmätieteet', english: 'Methodological Sciences', section: 'M–O', slug: 'm-o', description: 'Formaalit tieteet' },
  { finnish: 'Mielen kielen hypoteesi', english: 'Language of Thought', section: 'M–O', slug: 'm-o', description: 'Ajattelu kielenomaisena järjestelmänä' },
  { finnish: 'Mielikuva', english: 'Mental Image', section: 'M–O', slug: 'm-o', description: 'Havainnon kaltainen mentaalinen representaatio' },
  { finnish: 'Mind-body-ongelma', english: 'Mind-Body Problem', section: 'M–O', slug: 'm-o', description: 'Mielen ja ruumiin suhde' },
  { finnish: 'Modulaarisuus', english: 'Modularity', section: 'M–O', slug: 'm-o', description: 'Erikoistuneet osajärjestelmät' },
  { finnish: 'Monitoteutuvuus', english: 'Multiple Realizability', section: 'M–O', slug: 'm-o', description: 'Sama prosessi eri toteutuksissa' },
  { finnish: 'Morfogeneesi', english: 'Morphogenesis', section: 'M–O', slug: 'm-o', description: 'Muodon kehitys' },
  { finnish: 'Muisti', english: 'Memory', section: 'M–O', slug: 'm-o', description: 'Informaation tallentaminen ja hakeminen' },
  { finnish: 'Nativismi', english: 'Nativism', section: 'M–O', slug: 'm-o', description: 'Synnynnäinen tieto' },
  { finnish: 'Neurologia', english: 'Neurology', section: 'M–O', slug: 'm-o', description: 'Hermoston tutkimus' },
  { finnish: 'Neuropsykologia', english: 'Neuropsychology', section: 'M–O', slug: 'm-o', description: 'Aivojen ja mielen suhteen tutkimus' },
  { finnish: 'Objektiivisuus', english: 'Objectivity', section: 'M–O', slug: 'm-o', description: 'Havainnoijasta riippumaton tieto' },
  { finnish: 'Ontogeneesi', english: 'Ontogenesis', section: 'M–O', slug: 'm-o', description: 'Yksilönkehitys' },
  { finnish: 'Ontologia', english: 'Ontology', section: 'M–O', slug: 'm-o', description: 'Olemassaolon tutkimus' },
  { finnish: 'Operationalisaatio', english: 'Operationalization', section: 'M–O', slug: 'm-o', description: 'Teorian testattavaksi muotoilu' },
  { finnish: 'Oppiminen', english: 'Learning', section: 'M–O', slug: 'm-o', description: 'Uuden tiedon hankkiminen' },

  // P-R
  { finnish: 'Plastisuus', english: 'Plasticity', section: 'P–R', slug: 'p-r', description: 'Kehityksen ja hermoston muovautuvuus' },
  { finnish: 'Positivismi', english: 'Positivism', section: 'P–R', slug: 'p-r', description: 'Havaintoihin rajattu tieteellisyys' },
  { finnish: 'Produktiivisuus', english: 'Productivity', section: 'P–R', slug: 'p-r', description: 'Rajaton yhdisteltävyys' },
  { finnish: 'Propositio', english: 'Proposition', section: 'P–R', slug: 'p-r', description: 'Merkityksellinen lausuma' },
  { finnish: 'Psykiatria', english: 'Psychiatry', section: 'P–R', slug: 'p-r', description: 'Mielenterveyshäiriöiden hoito' },
  { finnish: 'Psykolingvistiikka', english: 'Psycholinguistics', section: 'P–R', slug: 'p-r', description: 'Kielen psykologiset prosessit' },
  { finnish: 'Psykologia', english: 'Psychology', section: 'P–R', slug: 'p-r', description: 'Käyttäytymisen ja mielen tutkimus' },
  { finnish: 'Psykometrinen tutkimus', english: 'Psychometric Research', section: 'P–R', slug: 'p-r', description: 'Psykologinen mittaustutkimus' },
  { finnish: 'Psykopatologia', english: 'Psychopathology', section: 'P–R', slug: 'p-r', description: 'Mielenterveyshäiriöiden tutkimus' },
  { finnish: 'Päättely', english: 'Reasoning', section: 'P–R', slug: 'p-r', description: 'Johtopäätösten johtaminen premisseistä' },
  { finnish: 'Reduktionismi', english: 'Reductionism', section: 'P–R', slug: 'p-r', description: 'Selittäminen yksinkertaisemmilla osilla' },
  { finnish: 'Representaatio', english: 'Representation', section: 'P–R', slug: 'p-r', description: 'Sisäinen malli ulkomaailmasta' },
  { finnish: 'Rekursiivisuus', english: 'Recursion', section: 'P–R', slug: 'p-r', description: 'Itseviittaava prosessi' },
  { finnish: 'Reliabilismi', english: 'Reliabilism', section: 'P–R', slug: 'p-r', description: 'Luotettavaan prosessiin perustuva tieto' },

  // S-U
  { finnish: 'Semantiikka', english: 'Semantics', section: 'S–U', slug: 's-u', description: 'Merkityksen tutkimus' },
  { finnish: 'Sensorinen muisti', english: 'Sensory Memory', section: 'S–U', slug: 's-u', description: 'Hyvin lyhytkestoinen muisti' },
  { finnish: 'Symbolinen järjestelmä', english: 'Symbolic System', section: 'S–U', slug: 's-u', description: 'Symboleita käsittelevä järjestelmä' },
  { finnish: 'Syntaksi', english: 'Syntax', section: 'S–U', slug: 's-u', description: 'Kielen rakenne' },
  { finnish: 'Systeemi', english: 'System', section: 'S–U', slug: 's-u', description: 'Vuorovaikuttavien osien kokonaisuus' },
  { finnish: 'Systemaattisuus', english: 'Systematicity', section: 'S–U', slug: 's-u', description: 'Kognitiivisten kykyjen säännönmukaisuus' },
  { finnish: 'Tarkkaavuus', english: 'Attention', section: 'S–U', slug: 's-u', description: 'Resurssien kohdentaminen informaatioon' },
  { finnish: 'Teoria', english: 'Theory', section: 'S–U', slug: 's-u', description: 'Systemaattinen selitys ilmiöille' },
  { finnish: 'Tietoisuus', english: 'Consciousness', section: 'S–U', slug: 's-u', description: 'Subjektiivinen kokemus' },
  { finnish: 'Tieto', english: 'Knowledge', section: 'S–U', slug: 's-u', description: 'Perusteltu tosi uskomus' },
  { finnish: 'Turingin testi', english: 'Turing Test', section: 'S–U', slug: 's-u', description: 'Tekoälyn arvioinnin testi' },
  { finnish: 'Universaali kielioppi', english: 'Universal Grammar', section: 'S–U', slug: 's-u', description: 'Synnynnäinen kieliopillinen tieto' },
  { finnish: 'Uniikki toteutus', english: 'Unique Realization', section: 'S–U', slug: 's-u', description: 'Yksi toteutus per mentaalinen tila' },

  // V-Ö
  { finnish: 'Valenssi', english: 'Valence', section: 'V–Ö', slug: 'v-o', description: 'Affektiivisen kokemuksen ulottuvuus' },
  { finnish: 'Validiteetti', english: 'Validity', section: 'V–Ö', slug: 'v-o', description: 'Mittarin tarkkuus' },
  { finnish: 'Vinouma', english: 'Bias', section: 'V–Ö', slug: 'v-o', description: 'Systemaattinen poikkeama rationaalisuudesta' },
  { finnish: 'Virtuaalinen', english: 'Virtual', section: 'V–Ö', slug: 'v-o', description: 'Tietokonesimulaation tuottama' },
  { finnish: 'Visuaalinen prosessointi', english: 'Visual Processing', section: 'V–Ö', slug: 'v-o', description: 'Näköinformaation käsittely' },
  { finnish: 'Yhteensopimattomuus', english: 'Incompatibility', section: 'V–Ö', slug: 'v-o', description: 'Teorioiden ristiriitaisuus' },
  { finnish: 'Yksinkertaisuus', english: 'Parsimony', section: 'V–Ö', slug: 'v-o', description: 'Yksinkertaisempi selitys on parempi' },
  { finnish: 'Yksilönkehitys', english: 'Ontogenesis', section: 'V–Ö', slug: 'v-o', description: 'Yksilön kehitys' },
  { finnish: 'Ymmärtäminen', english: 'Understanding', section: 'V–Ö', slug: 'v-o', description: 'Merkityksen tavoittaminen' },
  { finnish: 'Ärsyke', english: 'Stimulus', section: 'V–Ö', slug: 'v-o', description: 'Aistireseptoreita aktivoiva tekijä' },
];

// Search function that matches both Finnish and English terms
export function searchVocabulary(query: string): VocabularyTerm[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();

  return vocabularyTerms.filter((term) => {
    const finnishMatch = term.finnish.toLowerCase().includes(normalizedQuery);
    const englishMatch = term.english.toLowerCase().includes(normalizedQuery);
    const descriptionMatch = term.description.toLowerCase().includes(normalizedQuery);
    return finnishMatch || englishMatch || descriptionMatch;
  });
}
