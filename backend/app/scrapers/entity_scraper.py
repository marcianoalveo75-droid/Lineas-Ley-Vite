import requests
from bs4 import BeautifulSoup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.models import Entity

INITIAL_ENTITIES = [
    {
        "name": "Baal",
        "type": "Principado",
        "influence": "Idolatría, Materialismo",
        "description": "Antigua deidad cananea asociada con las tormentas y la fertilidad.",
        "biblical_reference": "Jueces 2:13",
        "countermeasures": "Ayuno, Oración de renuncia a ídolos."
    },
    {
        "name": "Astarot",
        "type": "Potestad",
        "influence": "Seducción, Lujuria",
        "description": "Deidad asociada con la fertilidad, el amor y la guerra.",
        "biblical_reference": "1 Samuel 7:3",
        "countermeasures": "Vigilancia, Pureza mental."
    },
    {
        "name": "Leviatán",
        "type": "Demonio Marino",
        "influence": "Orgullo, Caos",
        "description": "Monstruo marino bíblico, símbolo del caos y las fuerzas del mal. Relacionado con soberbia.",
        "biblical_reference": "Isaías 27:1",
        "countermeasures": "Humildad, Adoración."
    },
    {
        "name": "Mammon",
        "type": "Espíritu",
        "influence": "Avaricia, Riqueza injusta",
        "description": "Personificación de la riqueza y la avaricia.",
        "biblical_reference": "Mateo 6:24",
        "countermeasures": "Generosidad, Diezmo."
    },
    {
        "name": "Legión",
        "type": "Multitud",
        "influence": "Opresión mental, Locura",
        "description": "Grupo de demonios que poseían a un hombre en Gadara.",
        "biblical_reference": "Marcos 5:9",
        "countermeasures": "Autoridad en Cristo, Liberación."
    },
    {
        "name": "Belial",
        "type": "Principado",
        "influence": "Rebeldía, Anarquía",
        "description": "Asociado con la falta de ley y la maldad pura.",
        "biblical_reference": "2 Corintios 6:15",
        "countermeasures": "Sujeción a la autoridad, Orden."
    },
    # === ÁNGELES ===
    {
        "name": "Miguel",
        "type": "Arcángel",
        "influence": "Protección, Justicia Divina",
        "description": "El guerrero de Dios, protector contra las fuerzas oscuras.",
        "biblical_reference": "Apocalipsis 12:7",
        "countermeasures": "Invocar justicia, Fe inquebrantable."
    },
    {
        "name": "Rafael",
        "type": "Arcángel",
        "influence": "Sanación, Restauración",
        "description": "Medicina de Dios, trae salud física y espiritual.",
        "biblical_reference": "Tobías (Apócrifo), Tradición",
        "countermeasures": "Oración por salud, Obras de misericordia."
    },
    # === DEMONIOS ADICIONALES ===
    {
        "name": "Moloch",
        "type": "Principado",
        "influence": "Sacrificio de inocentes, Injusticia",
        "description": "Demandaba sacrificios de niños. Asociado a aborto y abuso.",
        "biblical_reference": "Levítico 18:21",
        "countermeasures": "Protección de débiles, Santidad de vida."
    },
    {
        "name": "Pazuzu",
        "type": "Demonio del Viento",
        "influence": "Plagas, Tormentas, Enfermedad",
        "description": "Portador de tormentas y sequías. Entidad destructiva del clima.",
        "biblical_reference": "Mitología Asiria/Babilónica",
        "countermeasures": "Oración contra desastres, Refugio en Dios."
    },
    {
        "name": "Asmodeo",
        "type": "Rey Demonio",
        "influence": "Lujuria destructiva, Ira",
        "description": "Destructor de matrimonios y relaciones por medio del placer.",
        "biblical_reference": "Tobías 3:8",
        "countermeasures": "Castidad, Fidelidad, Ayuno."
    },
    # === ESPÍRITUS URBANOS (CYBERPUNK) ===
    {
        "name": "Egregor Digital",
        "type": "Espíritu Moderno",
        "influence": "Confusión, Adicción a Datos",
        "description": "Manifestación colectiva de la obsesión por la información y redes.",
        "biblical_reference": "N/A (Fenómeno Moderno)",
        "countermeasures": "Desconexión, Silencio, Meditación."
    },
    {
        "name": "Espectro de Neón",
        "type": "Espíritu Urbano",
        "influence": "Soledad, Aislamiento",
        "description": "Se alimenta de la tristeza de quienes viven solos en grandes ciudades.",
        "biblical_reference": "N/A",
        "countermeasures": "Comunidad, Compañerismo, caridad."
    },
    {
        "name": "Vigilante Silencioso",
        "type": "Espíritu de Control",
        "influence": "Paranoia, Miedo a ser observado",
        "description": "Entidad que prospera en sociedades de alta vigilancia y control.",
        "biblical_reference": "N/A",
        "countermeasures": "Libertad de espíritu, Confianza."
    }
]

class WikiDemonScraper:
    URL = "https://en.wikipedia.org/wiki/List_of_theological_demons"
    
    def fetch_data(self):
        print(f"Fetching data from {self.URL}...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
        try:
            response = requests.get(self.URL, headers=headers)
            print(f"Status Code: {response.status_code}")
            if response.status_code != 200:
                print("Failed to fetch page")
                return []
        except Exception as e:
            print(f"Request failed: {e}")
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        entities = []
        
        content = soup.find(id="mw-content-text")
        if not content:
            print("No content div found")
            return []
            
        # Strategy: Look for all list items
        for li in content.find_all('li'):
            text = li.get_text().strip()
            
            # Skip short items or citations
            if len(text) < 10 or text.startswith("^"):
                continue

            name = None
            description = None
            
            # Strategy 1: Look for bold element
            bold = li.find('b')
            if bold:
                name = bold.get_text().strip()
                description = text[len(name):].strip()
            
            # Strategy 2: Look for link at the beginning
            elif li.find('a', recursive=False) or (li.find('a') and text.startswith(li.find('a').get_text())):
                link = li.find('a')
                name = link.get_text().strip()
                description = text[len(name):].strip()

            # Strategy 3: Split by common separators
            elif " – " in text:
                parts = text.split(" – ", 1)
                name = parts[0].strip()
                description = parts[1].strip()
            elif " - " in text:
                parts = text.split(" - ", 1)
                name = parts[0].strip()
                description = parts[1].strip()
            elif ": " in text:
                parts = text.split(": ", 1)
                name = parts[0].strip()
                description = parts[1].strip()

            if name:
                # Cleanup and validate
                # remove leading separators from description
                if description:
                    for sep in ["-", "–", ":", "—"]:
                        if description.startswith(sep):
                            description = description[1:].strip()
                else:
                    description = "No description available"

                # Cleanup Name
                if "[" in name: name = name.split("[")[0].strip()
                if "(" in name and ")" in name: 
                     # Optional: remove parentheticals from name if desired, or keep them
                     pass
                
                # Cleanup Description
                if "[" in description: description = description.split("[")[0].strip()
                
                # Basic validation
                if len(name) > 1 and len(name) < 100:
                    entities.append({
                        "name": name,
                        "type": "Scraped Entity", 
                        "influence": "Unknown",
                        "description": description,
                        "biblical_reference": "Wikipedia",
                        "countermeasures": None
                    })
        
        return entities

async def seed_entities(session: AsyncSession):
    print("Checking database seeds...")
    count = 0
    for data in INITIAL_ENTITIES:
        # Check if specific entity exists
        result = await session.execute(select(Entity).filter(Entity.name == data["name"]))
        existing = result.scalars().first()
        
        if not existing:
            # Add new entity
            print(f"Seeding: {data['name']}")
            # Add default attribution for seed data
            data['source'] = "System Seed"
            data['contributor'] = "System"
            entity = Entity(**data)
            session.add(entity)
            count += 1
    
    if count > 0:
        await session.commit()
        print(f"Seed complete. Added {count} new entities.")
    else:
        print("Database up to date. No new entities added.")

async def run_wiki_scraper(session: AsyncSession):
    scraper = WikiDemonScraper()
    scraped_data = scraper.fetch_data()
    print(f"Found {len(scraped_data)} potential entities.")
    
    count = 0
    for data in scraped_data:
        # Check if exists
        result = await session.execute(select(Entity).filter(Entity.name == data["name"]))
        existing = result.scalars().first()
        
        if not existing:
            entity = Entity(**data)
            session.add(entity)
            count += 1
            
    await session.commit()
    return count
