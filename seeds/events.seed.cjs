require("dotenv").config();

const mongoose = require("mongoose");
const Event = require("../models/Event.model");

const CREATED_BY_ID = "69712ab243f6b3a71675f0d7";

function oid(id) {
  return new mongoose.Types.ObjectId(id);
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(19, 0, 0, 0);
  return d;
}

function makeDescription(category) {
  const c = String(category || "Other").toLowerCase();
  return `A ${c} focused event with talks, activities and networking. Ideal for people interested in ${c} experiences.`;
}

function makePrice(i) {
  return i % 2 === 0 ? 0 : 10;
}

async function seedEvents() {
  const reset = process.argv.includes("--reset");

  try {
    console.log("Starting events seed...");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const seedTagPrefix = "SEED:";

    const categories = [
      "Tech",
      "Music",
      "Sports",
      "Food",
      "Networking",
      "Art",
      "Gaming",
      "Education",
      "Business",
      "Other",
    ];

    const cities = [
      { city: "Madrid", country: "Spain" },
      { city: "Barcelona", country: "Spain" },
      { city: "Valencia", country: "Spain" },
      { city: "Seville", country: "Spain" },
      { city: "Zaragoza", country: "Spain" },
      { city: "Málaga", country: "Spain" },
      { city: "Bilbao", country: "Spain" },
      { city: "Alicante", country: "Spain" },
    ];

    const imagesByCategory = {
      Tech: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      Music: "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2",
      Sports: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
      Food: "https://images.unsplash.com/photo-1498579809087-ef1e558fd1da",
      Networking:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      Art: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      Gaming: "https://images.unsplash.com/photo-1511512578047-dfb367046420",
      Education: "https://images.unsplash.com/photo-1509062522246-3755977927d7",
      Business: "https://images.unsplash.com/photo-1507679799987-c73779587ccf",
      Other: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
    };

    // Tus eventos "top" (mantener)
    const curatedEvents = [
      {
        title: `${seedTagPrefix} Tech & Tapas: React Night Madrid`,
        description:
          "Mini-talks + networking con devs. Bring your laptop if you want to pair on a bug. Snacks included.",
        date: new Date("2026-02-05T18:30:00.000Z"),
        location: "Madrid, Spain",
        venueName: "Impact Hub Madrid",
        address: "Calle de la Alameda, 22",
        city: "Madrid",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
        category: "Tech",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Salsa Social with Live Percussion`,
        description:
          "Noche de salsa con música en vivo. No importa el nivel. Good vibes, buen cardio.",
        date: new Date("2026-02-07T20:00:00.000Z"),
        location: "Barcelona, Spain",
        venueName: "Sala Apolo (zona social)",
        address: "Carrer Nou de la Rambla, 113",
        city: "Barcelona",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
        category: "Music",
        isPublic: true,
        price: 10,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Sunday Run Club 5K Easy Pace`,
        description:
          "Friendly 5K run + café after. Ideal para empezar hábito. Pace tranquilo.",
        date: new Date("2026-02-08T09:30:00.000Z"),
        location: "Valencia, Spain",
        venueName: "Jardín del Turia (meeting point)",
        address: "Puente de las Flores (referencia)",
        city: "Valencia",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1526401485004-2aa7f3c6bdb3",
        category: "Sports",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Street Food Tour: Sabores de Sevilla`,
        description:
          "Ruta gastronómica por spots locales. Tapas, dulce y una sorpresa final. Ven con hambre.",
        date: new Date("2026-02-10T18:00:00.000Z"),
        location: "Seville, Spain",
        venueName: "Centro (punto de encuentro)",
        address: "Plaza Nueva (junto a la fuente)",
        city: "Seville",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
        category: "Food",
        isPublic: true,
        price: 10,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Founder Coffee: Ideas to Execution`,
        description:
          "Networking para builders. Quick intros, feedback real, y a construir. No postureo.",
        date: new Date("2026-02-12T08:30:00.000Z"),
        location: "Bilbao, Spain",
        venueName: "Cafe cowork corner",
        address: "Gran Vía (zona)",
        city: "Bilbao",
        country: "Spain",
        imageUrl: "https://images.unsplash.com/photo-1556761175-129418cb2dfe",
        category: "Networking",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Art Jam: Sketch and Chill`,
        description:
          "Sesión libre de dibujo/ilustración. Trae cuaderno y hacemos mini-reto de 20 minutos.",
        date: new Date("2026-02-13T17:30:00.000Z"),
        location: "Málaga, Spain",
        venueName: "Espacio Creativo Centro",
        address: "Calle Granada (zona)",
        city: "Málaga",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
        category: "Art",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Gaming Night: Mario Kart and Indie Showcase`,
        description:
          "Torneo amistoso de Mario Kart + mini showcase de indies. Premios simbólicos, ambiente sano.",
        date: new Date("2026-02-14T19:00:00.000Z"),
        location: "Zaragoza, Spain",
        venueName: "Gaming Bar",
        address: "Paseo Independencia (zona)",
        city: "Zaragoza",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1511512578047-dfb367046420",
        category: "Gaming",
        isPublic: true,
        price: 10,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Study Sprint: JavaScript Fundamentals (ES/EN)`,
        description:
          "Grupo de estudio: loops, arrays, functions. Explicación corta + práctica con katas. Bring questions.",
        date: new Date("2026-02-16T18:00:00.000Z"),
        location: "Online",
        venueName: "Google Meet",
        address: "Link sent after RSVP",
        city: "Online",
        country: "Remote",
        imageUrl:
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
        category: "Education",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Business Breakfast: Personal Branding 101`,
        description:
          "Desayuno + charla práctica: CV, LinkedIn y portfolio. Sales con checklist accionable.",
        date: new Date("2026-02-18T07:45:00.000Z"),
        location: "Madrid, Spain",
        venueName: "Hotel Lobby Lounge",
        address: "Paseo de la Castellana (zona)",
        city: "Madrid",
        country: "Spain",
        imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df",
        category: "Business",
        isPublic: true,
        price: 10,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Private QA Event: Permissions and UI`,
        description:
          "Evento privado para probar permisos, favoritos y attending. If you see this, you are authorized.",
        date: new Date("2026-02-19T19:15:00.000Z"),
        location: "Barcelona, Spain",
        venueName: "Hidden Venue",
        address: "Shared privately",
        city: "Barcelona",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
        category: "Other",
        isPublic: false,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Padel Quick Match Mixer`,
        description:
          "Partidas cortas rotativas, ideal para conocer gente y sudar. Nivel intermedio recomendado.",
        date: new Date("2026-02-21T10:00:00.000Z"),
        location: "Alicante, Spain",
        venueName: "Club de Pádel",
        address: "Avenida (zona)",
        city: "Alicante",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
        category: "Sports",
        isPublic: true,
        price: 10,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Tech Talk: APIs, Axios and Clean Services`,
        description:
          "Cómo evitar spaghetti en React: services, axios, manejo de errores, y refactor en vivo.",
        date: new Date("2026-02-24T18:30:00.000Z"),
        location: "Valencia, Spain",
        venueName: "Meetup Space",
        address: "Carrer de Colón (zona)",
        city: "Valencia",
        country: "Spain",
        imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        category: "Tech",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Cooking Workshop: Paella Basics (ES/EN)`,
        description:
          "Taller práctico de paella: ingredientes, fuego y punto del arroz. Comemos juntos al final. Limited spots.",
        date: new Date("2026-02-26T17:00:00.000Z"),
        location: "Valencia, Spain",
        venueName: "Cocina Escuela",
        address: "Ruzafa (zona)",
        city: "Valencia",
        country: "Spain",
        imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2",
        category: "Food",
        isPublic: true,
        price: 10,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Music Producer Meetup: Loops and Coffee`,
        description:
          "Trae un loop de 30 segundos y lo escuchamos. Feedback rápido, ideas y collabs. Chill pero útil.",
        date: new Date("2026-02-28T16:00:00.000Z"),
        location: "Barcelona, Spain",
        venueName: "Studio Café",
        address: "Eixample (zona)",
        city: "Barcelona",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
        category: "Music",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Career Clinic: Mock Interviews (Online)`,
        description:
          "Mock interviews for junior devs. 20-min rounds: intro, technical basics, and feedback. English-friendly.",
        date: new Date("2026-03-03T18:00:00.000Z"),
        location: "Online",
        venueName: "Zoom",
        address: "Link sent after RSVP",
        city: "Online",
        country: "Remote",
        imageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        category: "Education",
        isPublic: true,
        price: 0,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
      {
        title: `${seedTagPrefix} Networking Afterwork: Portfolio Swap`,
        description:
          "Trae tu portfolio (o tu repo) y lo revisamos en grupos pequeños. Feedback amable pero directo.",
        date: new Date("2026-03-06T18:45:00.000Z"),
        location: "Madrid, Spain",
        venueName: "Cowork Lounge",
        address: "Chueca (zona)",
        city: "Madrid",
        country: "Spain",
        imageUrl:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
        category: "Networking",
        isPublic: true,
        price: 10,
        createdBy: oid(CREATED_BY_ID),
        attendees: [],
      },
    ];

    // Generador: 5 eventos por categoría (además de los curated)
    const generatedEvents = categories.flatMap((category, categoryIndex) =>
      Array.from({ length: 5 }).map((_, i) => {
        const place = cities[(i + categoryIndex) % cities.length];
        const dayOffset = 1 + categoryIndex * 3 + i;

        return {
          title: `${seedTagPrefix} ${category} Event ${i + 1} - ${place.city}`,
          description: makeDescription(category),
          date: daysFromNow(dayOffset),
          location: `${place.city}, ${place.country}`,
          venueName: `${place.city} Event Space`,
          address: "Main Street 123",
          city: place.city,
          country: place.country,
          imageUrl: imagesByCategory[category],
          category,
          isPublic: true,
          price: makePrice(i),
          createdBy: oid(CREATED_BY_ID),
          attendees: [],
        };
      }),
    );

    // Mezcla: curated + generated (evita duplicados por title)
    const byTitle = new Map();
    [...curatedEvents, ...generatedEvents].forEach((ev) => {
      if (!ev?.title) return;
      byTitle.set(ev.title, ev);
    });

    const events = Array.from(byTitle.values());

    if (reset) {
      const deleteResult = await Event.deleteMany({
        createdBy: oid(CREATED_BY_ID),
        title: { $regex: `^${seedTagPrefix}` },
      });
      console.log("Reset enabled. Deleted events:", deleteResult.deletedCount);
    }

    const insertResult = await Event.insertMany(events, { ordered: true });
    console.log("Inserted events:", insertResult.length);

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error seeding events:", error);
    try {
      await mongoose.connection.close();
    } catch (e) {}
  }
}

seedEvents();
