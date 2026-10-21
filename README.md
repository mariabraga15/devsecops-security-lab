# DevSecOps Security Lab

Website **intenționat vulnerabil**, pentru învățarea unui pipeline de securitate.
Rulează numai local, cu date fictive. Repository-ul public găzduiește surse,
nu o instanță publică a aplicației.

## Pornire

Ai nevoie de Node.js 22+ și Git. Din folderul repository-ului:

```sh
npm ci --ignore-scripts
npm test
npm start
```

Deschide http://127.0.0.1:3000. Serverul ascultă implicit numai pe localhost.
Alternativ, cu Docker Desktop pornit:

```sh
docker compose up --build
# Oprire:
docker compose down
```

Compose publică portul exclusiv pe `127.0.0.1`. Nu modifica această adresă
pentru a expune laboratorul pe internet. Nu introduce tokenuri sau date reale.

## Scanări și declanșatoare

GitHub Actions nu primește un eveniment pentru un commit rămas pe calculator.
Hook-ul local acoperă etapa înainte de commit; workflow-ul acoperă **fiecare push
pe orice branch**, crearea/actualizarea unui **pull request**, rularea manuală
și o scanare săptămânală luni la 06:23 UTC.

| Instrument | Înainte de commit | Push / PR | Scop |
| --- | --- | --- | --- |
| Gitleaks | Snapshot-ul fișierelor staged | Istoricul Git complet | Secrete și tokenul sintetic |
| Semgrep | Cod staged, reguli locale | Codul aplicației, reguli locale | XSS, path traversal, open redirect |
| Trivy | — | Filesystem + imagine Docker | Dependențe, configurații și pachete OS |
| CodeQL | — | JavaScript, security-extended | Analiză semantică; alerte în Security |
| OWASP Dependency-Check | — | Dependențe npm instalate și lockfile | SCA, rapoarte HTML și JSON |

Instalează hook-ul o singură dată pentru fiecare clonă, după ce ai pornit Docker:

```sh
npm run hooks:install
```

Hook-ul scanează o copie temporară a **indexului Git**. Fișierele nou adăugate
cu `git add` sunt incluse; modificările unstaged nu pot ascunde rezultate.
Rulează ambele scanări și blochează commit-ul la rezultate sau erori.
Hook-urile nu sunt instalate automat la clonare și pot fi ocolite local;
scanările CI rămân necesare.

## Cum interpretezi rezultatele

Starea inițială trebuie să producă finding-uri. Gitleaks, Semgrep și Trivy
returnează cod de eșec la finding-uri; Dependency-Check folosește pragul CVSS 7.
Joburile sunt independente, astfel încât un eșec nu împiedică celelalte scanări.
Rapoartele sunt păstrate ca Actions artifacts timp de 14 zile, inclusiv când
scanarea raportează vulnerabilități. Un raport lipsă sau o eroare de download
trebuie investigată ca eroare de infrastructură, nu ca vulnerabilitate găsită.

CodeQL publică alerte în **Security → Code scanning**; jobul poate fi verde
chiar când găsește vulnerabilități. Nu este configurată protecția branch-ului
sau blocarea merge-urilor. Pentru acestea sunt necesare reguli separate în
Settings → Rules → Rulesets și, dacă dorești, un prag pentru code scanning.
Păstrează un branch pentru exerciții și trimite remedierile prin PR.

Dependency-Check descarcă baza NVD. Prima rulare poate dura mult și poate
întâmpina rate limiting. Recomandat: obține o cheie de la
[NVD](https://nvd.nist.gov/developers/request-an-api-key) și adaug-o în
Settings → Secrets and variables → Actions sub numele `NVD_API_KEY`.
Cheia este opțională; fără ea actualizarea va fi mai lentă. PR-urile din fork-uri
nu primesc acest secret și folosesc accesul NVD fără cheie. Nu adăuga cheia în cod.

## Exerciții

| Exercițiu | Locație | Remediere propusă |
| --- | --- | --- |
| Reflected XSS (CWE-79) | `GET /search?q=...` | Escapare HTML contextuală sau template cu autoescape |
| Path traversal (CWE-22) | `GET /download?file=...` | Allowlist de documente și verificarea căii canonice |
| Open redirect (CWE-601) | `GET /redirect?next=...` | Destinații locale aprobate |
| Secret detection | `security/fixtures/demo-secret.txt` | Elimină tokenul sintetic și discută istoricul Git |
| Dependențe vechi | Express 4.17.1, lodash 4.17.20 | Actualizează versiuni și lockfile, apoi rescanează |

Tokenul `LAB_ONLY_…` nu funcționează la niciun serviciu. Regula Gitleaks locală
îl detectează intenționat și extinde regulile implicite. Nu este un secret real.
Eliminarea lui din working tree nu îl elimină din istoricul scanat în CI.
Într-un exercițiu ulterior poți adăuga o excepție explicită strict pentru fixture-ul
sintetic, justificată în PR; nu dezactiva regulile implicite sau scanarea istoricului.
Pentru un secret real, primul pas este revocarea/rotația lui.

Testele marcate `baseline` confirmă comportamentul vulnerabil inițial.
La remediere, înlocuiește așteptările cu teste care cer escapare/respingere;
altfel testele inițiale vor eșua tocmai pentru că vulnerabilitatea a fost eliminată.

## Securitatea pipeline-ului

Workflow-ul folosește `pull_request`, permisiuni minime și Actions fixate la SHA.
Nu pornește website-ul în CI, nu publică imagini, nu folosește `pull_request_target`
și nu include tokenuri reale. Scanerele containerizate sunt fixate la versiuni;
imaginea de bază Node urmărește linia 22-alpine și se poate modifica în timp.
Rapoartele Gitleaks sunt redactate. Semgrep folosește reguli locale fără cont sau token.
Dependabot urmărește Actions; actualizarea dependențelor vulnerabile este un exercițiu manual.

## Referințe

- [Gitleaks CLI și configurare](https://github.com/gitleaks/gitleaks)
- [Semgrep CLI](https://docs.semgrep.dev/cli-reference)
- [Trivy](https://github.com/aquasecurity/trivy)
- [CodeQL Action](https://github.com/github/codeql-action)
- [OWASP Dependency-Check](https://github.com/dependency-check/DependencyCheck)
