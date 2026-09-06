const CONTACT_TO = "dscottdaniels@dascoda.com";
const CONTACT_CC = "mark.meuleman@dascoda.com";
const CONTACT_FROM = "website@forms.dascoda.com";
const CONTACT_SUBJECT = "New Dascoda website inquiry";
const MAX_BODY_BYTES = 20000;

const FIELD_LIMITS = {
  "first-name": 80,
  "last-name": 80,
  company: 140,
  email: 160,
  phone: 40,
  "organization-type": 120,
  interest: 120,
  message: 3000,
};

const FIELD_LABELS = {
  "first-name": "First Name",
  "last-name": "Last Name",
  company: "Company",
  email: "Email",
  phone: "Phone",
  "organization-type": "Organization Type",
  interest: "Area of Interest",
  message: "Message",
};

const REQUIRED_FIELDS = ["first-name", "last-name", "company", "email", "message"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContactRequest(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return respond(request, { ok: false, message: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleContactRequest(request, env) {
  if (request.method !== "POST") {
    return respond(request, { ok: false, message: "Method not allowed" }, 405, {
      Allow: "POST",
    });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return respond(request, { ok: false, message: "Submission is too large" }, 413);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return respond(request, { ok: false, message: "Invalid submission" }, 400);
  }

  const honeypot = normalizeField(formData.get("website"));
  if (honeypot) {
    return respond(request, { ok: true }, 200);
  }

  const values = collectFields(formData);
  const validationError = validateFields(values);
  if (validationError) {
    return respond(request, { ok: false, message: validationError }, 400);
  }

  try {
    await env.EMAIL.send({
      from: {
        email: CONTACT_FROM,
        name: "Dascoda Website",
      },
      to: CONTACT_TO,
      cc: CONTACT_CC,
      replyTo: values.email,
      subject: CONTACT_SUBJECT,
      text: buildTextEmail(values),
      html: buildHtmlEmail(values),
    });
  } catch {
    return respond(request, { ok: false, message: "Message could not be sent" }, 502);
  }

  return respond(request, { ok: true }, 200);
}

function collectFields(formData) {
  return Object.fromEntries(
    Object.keys(FIELD_LIMITS).map((name) => [
      name,
      normalizeField(formData.get(name)),
    ])
  );
}

function normalizeField(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function validateFields(values) {
  for (const field of REQUIRED_FIELDS) {
    if (!values[field]) {
      return "Please complete the required fields.";
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return "Please enter a valid email address.";
  }

  for (const [field, maxLength] of Object.entries(FIELD_LIMITS)) {
    if (values[field].length > maxLength) {
      return `${FIELD_LABELS[field]} exceeds the maximum length.`;
    }
  }

  return "";
}

function wantsJson(request) {
  return request.headers.get("accept")?.includes("application/json");
}

function respond(request, body, status = 200, headers = {}) {
  if (wantsJson(request)) {
    return Response.json(body, { status, headers });
  }

  if (body.ok) {
    return Response.redirect(new URL("/thank-you.html", request.url), 303);
  }

  return new Response("Your message could not be sent. Please try again.", {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...headers,
    },
  });
}

function buildTextEmail(values) {
  return Object.keys(FIELD_LABELS)
    .map((name) => `${FIELD_LABELS[name]}: ${values[name] || "Not provided"}`)
    .join("\n");
}

function buildHtmlEmail(values) {
  const rows = Object.keys(FIELD_LABELS)
    .map(
      (name) => `
        <tr>
          <th align="left" style="padding:8px 12px;border-bottom:1px solid #d8dee9;color:#1F3A5F;">${escapeHtml(FIELD_LABELS[name])}</th>
          <td style="padding:8px 12px;border-bottom:1px solid #d8dee9;color:#27364a;">${escapeHtml(values[name] || "Not provided").replace(/\n/g, "<br>")}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#27364a;">
      <h1 style="font-size:22px;color:#1F3A5F;">New Dascoda website inquiry</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px;border:1px solid #d8dee9;">
        ${rows}
      </table>
    </div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
