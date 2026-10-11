import React, { useState } from "react";
import { usePreferences } from "../preferences";
import { Counter } from "../components/Counter";
import { EnquiryForm } from "../components/EnquiryForm";

export function Hero() {
  const { t } = usePreferences();
  const [selected, setSelected] = useState(false);
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="dot"></span>
          {t(" BIG DREAMS START HERE · YANGON")}
        </p>
        <h1>
          {t("Little minds.")}
          <br />
          {t("Big ")}
          <span className="dream">
            {t("possibilities.")}
            <svg viewBox="0 0 600 25" aria-hidden="true">
              <path d="M5 15 Q260 -2 592 12 M40 23 Q360 9 540 20"></path>
            </svg>
          </span>
        </h1>
        <p className="intro">
          {t(
            "A place to wonder, a space to grow. We nurture curious, confident children who are ready to make their mark on the world.",
          )}
        </p>
        <div className="actions">
          <a className="button" href="/programmes">
            {t("Find their next adventure ")}
            <span>{t("↗︎")}</span>
          </a>
          <a className="text-link" href="/about">
            {t("Get to know Guru ↓︎")}
          </a>
        </div>
        <div className="hero-note">
          <span className="scribble-star" aria-hidden="true">
            {t("✳︎")}
          </span>
          <p>
            {t("Every Child, Every Dream,")}
            <br />
            <strong>{t("Every Success.")}</strong>
          </p>
        </div>
      </div>
      <div
        className={selected ? "hero-art is-selected" : "hero-art"}
        tabIndex="0"
        role="button"
        aria-label={t("Float school photo")}
        aria-pressed={selected}
        onClick={() => setSelected(!selected)}
        onKeyDown={(event) => {
          if (["Enter", " "].includes(event.key)) {
            event.preventDefault();
            setSelected(!selected);
          }
        }}
      >
        <div className="photo-frame" data-parallax="0.07">
          <img
            src="/assets/hero.webp"
            alt={t(
              "A Guru student concentrating on a classroom drawing activity",
            )}
            fetchPriority="high"
            width="1200"
            height="900"
          />
          <span className="photo-caption">
            {t("TODAY’S CURIOSITY. TOMORROW’S CONFIDENCE.")}
          </span>
        </div>
        <div className="sticker" data-parallax="-0.04">
          {t("LET THEM")}
          <br />
          <strong>
            {t("dream")}
            <br />
            {t("BIG.")}
          </strong>
          <span>{t("↗︎")}</span>
        </div>
        <div className="little-label">
          {t("Small steps. Extraordinary journeys.")}
        </div>
        <span className="orbit" aria-hidden="true">
          {t("✦︎")}
        </span>
      </div>
      <a className="scroll-hint" href="/about">
        {t("SCROLL TO DISCOVER ")}
        <span>{t("↓︎")}</span>
      </a>
    </section>
  );
}

export function About() {
  const { t } = usePreferences();
  return (
    <section className="about section" id="about">
      <div className="section-top">
        <p className="eyebrow">{t("01 / A SCHOOL WITH HEART")}</p>
        <span>{t("Rooted in Yangon. Open to the world.")}</span>
      </div>
      <div className="about-grid">
        <h2>
          {t("Room to explore.")}
          <br />
          {t("Roots to ")}
          <em>{t("grow.")}</em>
        </h2>
        <div>
          <p className="large-copy">
            {t("Childhood is full of questions.")}
            <br />
            {t("We make space for every one.")}
          </p>
          <p>
            {t(
              "GURU International School blends international best practices with local values in a nurturing, inquiry-based environment. Creativity, character, and holistic development help every child grow with confidence and purpose.",
            )}
          </p>
          <p>
            {t(
              "Established in January 2025, our school brings families and educators together around one belief: every child deserves the chance to discover their potential.",
            )}
          </p>
          <p>
            {t(
              "At Guru, curiosity and character belong together. We want children to feel confident asking questions, trying again and treating others with care — while staying connected to their local community.",
            )}
          </p>
          <a className="text-link" href="/about#values">
            {t("Discover what guides us ↗︎")}
          </a>
        </div>
      </div>
      <div className="facts">
        <div>
          <strong aria-label={t("2 to 11 years")}>
            <Counter value="2" />
            <span className="count-separator" aria-hidden="true">
              {t("–")}
            </span>
            <Counter value="11" />
            <span aria-hidden="true">{t("years")}</span>
          </strong>
          <p>{t("A journey from early years to primary")}</p>
        </div>
        <div>
          <strong aria-label={t("6 to 1")}>
            <Counter value="6" />
            <span className="count-separator" aria-hidden="true">
              {t(":1")}
            </span>
          </strong>
          <p>{t("Student–teacher ratio*")}</p>
        </div>
        <div>
          <strong aria-label={t("15")}>
            <Counter value="15" />
          </strong>
          <p>{t("Class size in the school profile*")}</p>
        </div>
        <div>
          <strong aria-label={t("5")}>
            <Counter value="5" />
          </strong>
          <p>{t("Core values. One shared purpose.")}</p>
        </div>
      </div>
      <p className="source-note">
        {t(
          "*Figures reported in the supplied school profile. Ask our team for current class availability.",
        )}
      </p>
    </section>
  );
}

export function Programmes() {
  const { t } = usePreferences();
  return (
    <section className="programmes section" id="programmes">
      <div className="section-top">
        <p className="eyebrow">{t("02 / FIND THEIR STARTING POINT")}</p>
        <span>{t("Little steps, thoughtfully connected.")}</span>
      </div>
      <div className="heading-row">
        <h2>
          {t("A journey as unique")}
          <br />
          {t("as ")}
          <em>{t("your child.")}</em>
        </h2>
        <p>
          {t("From the first “why?” to the next big idea.")}
          <br />
          {t("Explore our early years and primary pathways.")}
        </p>
      </div>
      <div className="programme-cards">
        <article className="programme yellow">
          <span className="card-number">{t("01")}</span>
          <span className="card-icon" aria-hidden="true">
            {t("✳︎")}
          </span>
          <p className="eyebrow">{t("AGES 2–4")}</p>
          <h3>{t("Early years")}</h3>
          <p>
            {t(
              "A nurturing beginning, with child-centred learning and room to explore.",
            )}
          </p>
          <ul>
            <li>
              <span>{t("Play School")}</span>
              <strong>{t("Age 2")}</strong>
            </li>
            <li>
              <span>{t("Pre-Nursery")}</span>
              <strong>{t("Age 3")}</strong>
            </li>
            <li>
              <span>{t("Nursery")}</span>
              <strong>{t("Age 4")}</strong>
            </li>
          </ul>
          <p>
            {t(
              "The early years are a time to build friendships, discover through play and grow comfortable expressing ideas. Ask our team how the classroom routine supports your child’s first steps into school.",
            )}
          </p>
          <p className="curriculum">{t("Early Year Foundation Stage")}</p>
          <a href="/contact#visit" className="text-link">
            {t("Talk about early years ↗︎")}
          </a>
        </article>
        <article className="programme blue">
          <span className="card-number">{t("02")}</span>
          <span className="card-icon" aria-hidden="true">
            {t("↗︎")}
          </span>
          <p className="eyebrow">{t("AGES 5–7")}</p>
          <h3>{t("Lower primary")}</h3>
          <p>
            {t(
              "Build confidence, discover new ideas, and develop a love for learning.",
            )}
          </p>
          <ul>
            <li>
              <span>{t("Reception")}</span>
              <strong>{t("Age 5")}</strong>
            </li>
            <li>
              <span>{t("Year 1")}</span>
              <strong>{t("Age 6")}</strong>
            </li>
            <li>
              <span>{t("Year 2")}</span>
              <strong>{t("Age 7")}</strong>
            </li>
          </ul>
          <p>
            {t(
              "Reading, writing and number skills open the door to new discoveries. This stage connects those foundations with curiosity, creativity and the confidence to share ideas.",
            )}
          </p>
          <p className="curriculum">{t("Key Stage 1")}</p>
          <a href="/contact#visit" className="text-link">
            {t("Explore their next step ↗︎")}
          </a>
        </article>
        <article className="programme pink">
          <span className="card-number">{t("03")}</span>
          <span className="card-icon" aria-hidden="true">
            {t("✦︎")}
          </span>
          <p className="eyebrow">{t("AGES 8–11")}</p>
          <h3>{t("Upper primary")}</h3>
          <p>
            {t(
              "Deepen curiosity and develop skills to contribute positively to the world.",
            )}
          </p>
          <ul>
            <li>
              <span>{t("Year 3 / Year 4")}</span>
              <strong>{t("Ages 8 / 9")}</strong>
            </li>
            <li>
              <span>{t("Year 5 / Year 6")}</span>
              <strong>{t("Ages 10 / 11")}</strong>
            </li>
          </ul>
          <p>
            {t(
              "As children grow, learning becomes a chance to explain their thinking, solve problems and take greater responsibility. Talk with us about the next step from your child’s current school year.",
            )}
          </p>
          <p className="curriculum">{t("Key Stage 2")}</p>
          <a href="/contact#visit" className="text-link">
            {t("Discover upper primary ↗︎")}
          </a>
        </article>
      </div>
      <div className="curriculum-bar">
        <strong>{t("International learning. Local roots.")}</strong>
        <p>
          {t(
            "Cambridge Primary curriculum alongside Myanmar curriculum integration, with literacy, numeracy, science, arts, technology, and life skills.",
          )}
        </p>
        <p>
          {t(
            "A broad education gives children more ways to discover what interests them. International learning and Myanmar studies connect new knowledge with the language, culture and community around them.",
          )}
        </p>
      </div>
    </section>
  );
}

export function Life() {
  const { t } = usePreferences();
  return (
    <section className="life section" id="life">
      <div className="section-top">
        <p className="eyebrow">{t("03 / LIFE, IN FULL COLOUR")}</p>
        <span>{t("Real moments from our school.")}</span>
      </div>
      <div className="heading-row">
        <h2>
          {t("More than a classroom.")}
          <br />
          <em>{t("A world to discover.")}</em>
        </h2>
        <a className="text-link" href="/campus">
          {t("Take a look around ↓︎")}
        </a>
      </div>
      <div className="life-gallery">
        <button
          className="gallery-image tall"
          data-image="/assets/discovery.webp"
          data-caption={t("Learning through hands-on discovery")}
        >
          <img
            src="/assets/discovery.webp"
            alt={t("Two Guru students exploring a hands-on classroom activity")}
            loading="lazy"
          />
          <span>{t("Small discoveries. Big smiles. ↗︎")}</span>
        </button>
        <div className="gallery-stack">
          <button
            className="gallery-image"
            data-image="/assets/sports.webp"
            data-caption={t("Outdoor play and movement at Guru")}
          >
            <img
              src="/assets/sports.webp"
              alt={t(
                "Guru students taking part in outdoor movement activities",
              )}
              loading="lazy"
            />
            <span>{t("Room to play. Freedom to grow. ↗︎")}</span>
          </button>
          <div className="life-note">
            <span aria-hidden="true">{t("✷︎")}</span>
            <h3>
              {t("Learning happens")}
              <br />
              {t("everywhere.")}
            </h3>
            <p>
              {t(
                "STEAM, arts, languages, and sports bring new ways to explore beyond everyday lessons.",
              )}
            </p>
            <p>
              {t(
                "Creating, moving and exploring together give children opportunities to practise teamwork, express themselves and discover new interests. Explore our gallery for moments from school life, celebrations and trips.",
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Values() {
  const { t } = usePreferences();
  return (
    <section className="values section" id="values">
      <p className="eyebrow">{t("04 / WHAT MAKES US GURU")}</p>
      <h2>
        {t("Good minds.")}
        <br />
        <em>{t("Even better hearts.")}</em>
      </h2>
      <div className="value-grid">
        <div>
          <span>{t("01")}</span>
          <h3>{t("Integrity")}</h3>
          <p>{t("Being honest, fair, and respectful.")}</p>
        </div>
        <div>
          <span>{t("02")}</span>
          <h3>{t("Curiosity")}</h3>
          <p>{t("A love for learning and discovery.")}</p>
        </div>
        <div>
          <span>{t("03")}</span>
          <h3>{t("Respect")}</h3>
          <p>{t("Valuing diversity, kindness, and dignity.")}</p>
        </div>
        <div>
          <span>{t("04")}</span>
          <h3>{t("Excellence")}</h3>
          <p>{t("Doing our best in everything we do.")}</p>
        </div>
        <div>
          <span>{t("05")}</span>
          <h3>{t("Empathy")}</h3>
          <p>{t("Understanding and caring for others.")}</p>
        </div>
      </div>
      <div className="mission">
        <p>
          <strong>{t("Our vision")}</strong>
          {t(
            "A community where students explore, discover, and excel, empowered to become responsible, thoughtful leaders.",
          )}
        </p>
        <p>
          <strong>{t("Our approach")}</strong>
          {t(
            "Child-centred pedagogy, inquiry-based learning, differentiated instruction, and technology integration.",
          )}
        </p>
      </div>
    </section>
  );
}

export function Campus() {
  const { t } = usePreferences();
  const [filter, setFilter] = useState("all");
  return (
    <section className="campus section" id="campus">
      <div className="section-top">
        <p className="eyebrow">{t("05 / SPACES THAT INSPIRE")}</p>
        <span>{t("San Chaung, Yangon")}</span>
      </div>
      <div className="heading-row">
        <h2>
          {t("Make yourself")}
          <br />
          <em>{t("at home.")}</em>
        </h2>
        <div
          className="filters"
          role="group"
          aria-label={t("Filter campus photos")}
        >
          <button
            data-filter="all"
            aria-pressed={filter === "all"}
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            {t("All spaces")}
          </button>
          <button
            data-filter="learn"
            aria-pressed={filter === "learn"}
            className={filter === "learn" ? "active" : ""}
            onClick={() => setFilter("learn")}
          >
            {t("Learn")}
          </button>
          <button
            data-filter="play"
            aria-pressed={filter === "play"}
            className={filter === "play" ? "active" : ""}
            onClick={() => setFilter("play")}
          >
            {t("Play")}
          </button>
        </div>
      </div>
      <div className="campus-grid">
        <button
          className="campus-card"
          data-category="learn"
          data-image="/assets/classroom.webp"
          data-caption={t("Preschool classrooms")}
          hidden={filter !== "all" && filter !== "learn"}
        >
          <img
            src="/assets/classroom.webp"
            alt={t("A colourful preschool classroom with child-sized tables")}
            loading="lazy"
          />
          <span>{t("Preschool classrooms ↗︎")}</span>
        </button>
        <button
          className="campus-card"
          data-category="learn"
          data-image="/assets/primary.webp"
          data-caption={t("Primary classrooms")}
          hidden={filter !== "all" && filter !== "learn"}
        >
          <img
            src="/assets/primary.webp"
            alt={t(
              "Primary classroom with individual desks and bright windows",
            )}
            loading="lazy"
          />
          <span>{t("Primary classrooms ↗︎")}</span>
        </button>
        <button
          className="campus-card"
          data-category="play"
          data-image="/assets/playground.webp"
          data-caption={t("Indoor playground")}
          hidden={filter !== "all" && filter !== "play"}
        >
          <img
            src="/assets/playground.webp"
            alt={t("Colourful indoor playground at Guru")}
            loading="lazy"
          />
          <span>{t("Indoor playground ↗︎")}</span>
        </button>
        <button
          className="campus-card"
          data-category="play"
          data-image="/assets/outdoor.webp"
          data-caption={t("Outdoor play and sports area")}
          hidden={filter !== "all" && filter !== "play"}
        >
          <img
            src="/assets/outdoor.webp"
            alt={t("Guru outdoor play and sports area")}
            loading="lazy"
          />
          <span>{t("Outdoor adventures ↗︎")}</span>
        </button>
      </div>
      <p className="campus-extra">
        {t(
          "Also in our school: a library, PE playground and sports area, and a multipurpose hall.",
        )}
      </p>
    </section>
  );
}

export function Team() {
  const { t } = usePreferences();
  return (
    <section className="team section" id="team">
      <div className="section-top">
        <p className="eyebrow">{t("06 / PEOPLE WHO CARE")}</p>
        <span>{t("A shared commitment to every child.")}</span>
      </div>
      <div className="heading-row">
        <h2>
          {t("Behind every dream,")}
          <br />
          <em>{t("a dedicated team.")}</em>
        </h2>
        <p>
          {t("Educators who nurture potential.")}
          <br />
          {t("Leaders who make room for it.")}
        </p>
      </div>
      <div className="team-grid">
        <article>
          <img
            src="/assets/principal.webp"
            alt={t("Mr. Naing Win Latt")}
            loading="lazy"
          />
          <div>
            <p className="eyebrow">{t("PRINCIPAL / HEAD OF SCHOOL")}</p>
            <h3>{t("Mr. Naing Win Latt")}</h3>
            <p>
              {t(
                "Nearly 30 years in Myanmar’s education sector, with experience in school leadership, teacher development, curriculum alignment, and Biology education.",
              )}
            </p>
          </div>
        </article>
        <article>
          <img
            src="/assets/founder.webp"
            alt={t("Mr. Swan Yee Phyo")}
            loading="lazy"
          />
          <div>
            <p className="eyebrow">{t("FOUNDER")}</p>
            <h3>{t("Mr. Swan Yee Phyo")}</h3>
            <p>
              {t(
                "Committed to unlocking every student's potential and nurturing responsible, compassionate leaders.",
              )}
            </p>
          </div>
        </article>
        <article>
          <div className="chairman-portrait">
            <div className="chairman-crop profile-motion">
              <img
                className="portrait-crop-source"
                src="/assets/chairman.webp"
                alt={t("Mr. Aung Min Soe")}
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <p className="eyebrow">{t("CHAIRMAN")}</p>
            <h3>{t("Mr. Aung Min Soe")}</h3>
            <p>
              {t(
                "Provides strategic guidance for the school’s long-term development and educational mission.",
              )}
            </p>
          </div>
        </article>
        <article id="ceo-profile">
          <img
            src="/assets/ceo.webp?v=white-background"
            alt={t("Ms. Tin Tin Khaing")}
            loading="lazy"
          />
          <div>
            <p className="eyebrow">{t("CHIEF EXECUTIVE OFFICER")}</p>
            <h3>{t("Ms. Tin Tin Khaing")}</h3>
            <p>{t("Chief Executive Officer of GURU International School.")}</p>
          </div>
        </article>
        <article id="operations-profile">
          <img
            src="/assets/operations.webp"
            alt={t("Mr. Htun Aung Kyaw")}
            loading="lazy"
          />
          <div>
            <p className="eyebrow">{t("HR & OPERATIONS MANAGER")}</p>
            <h3>{t("Mr. Htun Aung Kyaw")}</h3>
            <p>
              {t("HR and Operations Manager of GURU International School.")}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

export function Community() {
  const { t } = usePreferences();
  return (
    <section className="community section">
      <div>
        <p className="eyebrow">{t("FAMILIES BELONG HERE, TOO.")}</p>
        <h2>
          {t("Growing together")}
          <br />
          {t("starts with ")}
          <em>{t("connection.")}</em>
        </h2>
      </div>
      <div className="community-details">
        <details open="">
          <summary>
            {t("Parent consultations ")}
            <span>{t("+")}</span>
          </summary>
          <p>
            {t(
              "Families and teachers collaborate to support better student outcomes.",
            )}
          </p>
        </details>
        <details>
          <summary>
            {t("Coffee mornings ")}
            <span>{t("+")}</span>
          </summary>
          <p>
            {t(
              "Share student progress and discuss school-wide improvements in a welcoming setting.",
            )}
          </p>
        </details>
        <details>
          <summary>
            {t("Parent–teacher meetings ")}
            <span>{t("+")}</span>
          </summary>
          <p>
            {t(
              "Meetings are held once per term after assessments, keeping families involved in their child's learning.",
            )}
          </p>
        </details>
        <details>
          <summary>
            {t("School registration and accreditation ")}
            <span>{t("+")}</span>
          </summary>
          <p>
            {t(
              "The supplied profile reports a Yangon City Development Committee licence and compliance with Myanmar Ministry of Education procedures. Pearson accreditation and preschool licensing are described as being pursued. Contact the school for the latest status.",
            )}
          </p>
        </details>
        <details>
          <summary>
            {t("How do I choose the right programme?")}
            <span>{t("+")}</span>
          </summary>
          <p>
            {t(
              "The age ranges are a starting guide. Share your child’s age, previous learning experience and interests with our team so you can discuss a suitable pathway. Ask about current places, entry requirements and fees before making a decision.",
            )}
          </p>
        </details>
        <details>
          <summary>
            {t("What should I ask during a school visit?")}
            <span>{t("+")}</span>
          </summary>
          <p>
            {t(
              "Bring questions about the daily routine, language learning, how teachers share progress and how children settle into school. Seeing the learning spaces and speaking with our team can help you decide whether Guru feels right for your family.",
            )}
          </p>
        </details>
        <details>
          <summary>
            {t("How can we encourage learning at home?")}
            <span>{t("+")}</span>
          </summary>
          <p>
            {t(
              "Small moments matter: read together, talk about the day, count everyday objects and make time for play. Encourage questions and celebrate effort. At parent consultations, ask your child’s teacher for ideas suited to their current learning.",
            )}
          </p>
        </details>
      </div>
    </section>
  );
}

export function Contact() {
  const { t } = usePreferences();
  return (
    <section className="visit section" id="visit">
      <div className="visit-copy">
        <div className="visit-intro">
          <p className="eyebrow">{t("YOUR CHILD’S NEXT CHAPTER")}</p>
          <h2>
            {t("Come curious.")}
            <br />
            {t("Leave ")}
            <em>{t("inspired.")}</em>
            <span aria-hidden="true">{t("↗︎")}</span>
          </h2>
          <p>
            {t("The best way to get to know Guru? Step inside.")}
            <br />
            {t(
              "Speak with our team to arrange a visit and explore the right programme for your child.",
            )}
          </p>
          <p>
            {t(
              "Tell us your child’s age, current school year and what matters most to your family. We can discuss programme options, current availability and a suitable visit time. Please wait for the school to confirm your visit.",
            )}
          </p>
        </div>
        <div className="enquiry-card">
          <p className="eyebrow">{t("LET’S START A CONVERSATION")}</p>
          <h3>{t("How can we help?")}</h3>
          <p>
            {t(
              "Ask a question, discuss a programme or request a school visit. Leave your contact details so our admissions team can reply.",
            )}
          </p>
          <EnquiryForm />
        </div>
        <div className="visit-contact-links">
          <a className="text-link" href="mailto:mooseythaw03@gmail.com">
            {t("Prefer email? Write to our team ↗︎")}
          </a>
          <a className="text-link" href="tel:+959404466882">
            {t("Or call 09 40 44 66 882")}
          </a>
        </div>
      </div>
      <div className="contact-box" id="contact">
        <p className="eyebrow">{t("CONTACT US")}</p>
        <p className="eyebrow">{t("FIND US IN YANGON")}</p>
        <h3>
          {t("A warm welcome")}
          <br />
          {t("is waiting.")}
        </h3>
        <address>
          {t("No. (2), Myay Ni Street,")}
          <br />
          {t("Mote Lote Saung (South) Quarter,")}
          <br />
          {t("San Chaung Township,")}
          <br />
          {t("Yangon, Myanmar.")}
        </address>
        <a
          className="map-preview"
          href="https://www.google.com/maps/search/?api=1&query=Guru+International+School+Myay+Ni+Street+Yangon"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/assets/map.webp"
            alt={t(
              "School location map from the Guru profile, near U Wisara Road in San Chaung",
            )}
            loading="lazy"
          />
          <span>{t("View on Google Maps ↗︎")}</span>
        </a>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Guru+International+School+Myay+Ni+Street+Yangon"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          {t("Open directions ↗︎")}
        </a>
        <div className="contact-lines">
          <a href="tel:+959404466882">{t("09 40 44 66 882")}</a>
          <a href="tel:+959404466883">{t("09 40 44 66 883")}</a>
          <a href="mailto:mooseythaw03@gmail.com">
            {t("mooseythaw03@gmail.com")}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = usePreferences();
  return (
    <footer className="school-footer">
      <div className="footer-invitation">
        <div>
          <p className="eyebrow">{t("A BRIGHTER NEXT CHAPTER")}</p>
          <h2>{t("Let’s grow together.")}</h2>
          <p>
            {t(
              "Come meet our team and discover a place for your child to thrive.",
            )}
          </p>
        </div>
        <a className="button" href="/contact#visit">
          {t("Arrange a school visit ↗︎")}
        </a>
      </div>
      <div className="footer-identity">
        <a className="brand" href="/">
          <img src="/assets/crest.png" alt="" width="47" height="57" />
          <span>
            {t("GURU")}
            <small>{t("INTERNATIONAL SCHOOL")}</small>
          </span>
        </a>
        <p>{t("A caring community. A world of possibility.")}</p>
        <a className="footer-motto" href="/about">
          {t("Every Child, Every Dream, Every Success.")}
        </a>
      </div>
      <nav className="footer-explore" aria-label={t("Explore our school")}>
        <h3>{t("Discover Guru")}</h3>
        <a href="/about">{t("Discover our story ↗︎")}</a>
        <a href="/programmes">{t("Explore our programmes ↗︎")}</a>
        <a href="/gallery">{t("School moments ↗︎")}</a>
      </nav>
      <div className="footer-connect">
        <h3>{t("Let’s connect")}</h3>
        <a href="tel:+959404466882">09 40 44 66 882</a>
        <p>{t("San Chaung, Yangon")}</p>
        <div className="footer-social">
          {" "}
          <a
            className="footer-facebook"
            href="https://www.facebook.com/share/1LxALvgQmL/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("Visit Guru on Facebook (opens in a new tab)")}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.022 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.49 0-1.956.93-1.956 1.885v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.095 24 18.1 24 12.073Z" />
            </svg>
          </a>
          <span>{t("Follow our school community")}</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © <span id="year">{new Date().getFullYear()}</span>{" "}
          {t("Guru International School")}
        </span>
        <nav className="footer-links" aria-label={t("Footer links")}>
          <a href="/privacy.html">{t("Privacy & visitor statistics")}</a>
          <a href="#">{t("Back to the top ↑︎")}</a>
        </nav>
      </div>
    </footer>
  );
}

export function Ticker() {
  const { t } = usePreferences();
  return (
    <div className="ticker" aria-hidden="true">
      <div>
        {t(
          "STAY CURIOUS ✳︎ DREAM BIG ✳︎ GROW TOGETHER ✳︎ BE YOURSELF ✳︎ STAY CURIOUS ✳︎ DREAM BIG ✳︎ GROW TOGETHER ✳︎ BE YOURSELF ✳︎ ",
        )}
      </div>
    </div>
  );
}
