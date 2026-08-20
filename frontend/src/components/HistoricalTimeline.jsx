import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const EVENTS = [
  { year: 1957, title: "Sputnik 1", desc: "First artificial satellite (USSR)", agency: "Roscosmos", 
    longDesc: "The Soviet Union successfully launched Sputnik 1, the world's first artificial satellite. This marked the beginning of the Space Age and triggered the Space Race between the USA and the USSR.", 
    imageUrl: "/images/sputnik_1_1780397005475.png" },
  { year: 1961, title: "Vostok 1", desc: "First human in space, Yuri Gagarin (USSR)", agency: "Roscosmos", 
    longDesc: "Yuri Gagarin became the first human to journey into outer space, completing one orbit of Earth in 108 minutes.", 
    imageUrl: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&q=80&w=800" },
  { year: 1969, title: "Apollo 11", desc: "First humans on the Moon (USA)", agency: "NASA", 
    longDesc: "Neil Armstrong and Buzz Aldrin became the first humans to walk on the lunar surface. Armstrong's famous words: 'That's one small step for man, one giant leap for mankind.'", 
    imageUrl: "/images/apollo_11_1780397035653.png" },
  { year: 1975, title: "Aryabhata", desc: "India's first satellite (ISRO)", agency: "ISRO", 
    longDesc: "Named after the prominent 5th-century Indian astronomer, Aryabhata was India's first satellite, completely designed and fabricated in India and launched by a Soviet Kosmos-3M rocket.", 
    imageUrl: "/images/aryabhata_sat_1780397050418.png" },
  { year: 1980, title: "Rohini RS-1", desc: "First satellite launched by Indian vehicle (ISRO)", agency: "ISRO", 
    longDesc: "ISRO successfully placed the Rohini RS-1 satellite into orbit using its own Satellite Launch Vehicle (SLV-3), making India the sixth member of the exclusive space-faring club.", 
    imageUrl: "/images/slv_rocket_1780397065201.png" },
  { year: 1981, title: "STS-1", desc: "First Space Shuttle flight (USA)", agency: "NASA", 
    longDesc: "The launch of Space Shuttle Columbia ushered in a new era of reusable spacecraft, designed to lower the cost of accessing space and build the International Space Station.", 
    imageUrl: "/images/space_shuttle_1780397078692.png" },
  { year: 1984, title: "Rakesh Sharma", desc: "First Indian citizen in space (ISRO/USSR)", agency: "ISRO", 
    longDesc: "Rakesh Sharma flew aboard the Soviet T-11 mission. When asked by Prime Minister Indira Gandhi how India looked from space, he famously replied 'Sare Jahan Se Achha' (Best in the world).", 
    imageUrl: "/images/rakesh_sharma_1780397093053.png" },
  { year: 1993, title: "PSLV Maiden Flight", desc: "ISRO's workhorse rocket first launch", agency: "ISRO", 
    longDesc: "The Polar Satellite Launch Vehicle (PSLV) took its maiden flight. It has since become one of the most reliable and highly sought-after launch vehicles in the global commercial market.", 
    imageUrl: "/images/pslv_rocket_1780397107031.png" },
  { year: 1998, title: "ISS First Module", desc: "Zarya launched, starting the ISS era", agency: "Other", 
    longDesc: "The Zarya module was launched, marking the beginning of the International Space Station—the largest and most complex international scientific project in history.", 
    imageUrl: "/images/iss_station_1780397121379.png" },
  { year: 2008, title: "Chandrayaan-1", desc: "India's first lunar probe, discovered water", agency: "ISRO", 
    longDesc: "India's first mission to the Moon made the groundbreaking discovery of water molecules on the lunar surface using its Moon Impact Probe.", 
    imageUrl: "/images/chandrayaan_1_1780397134728.png" },
  { year: 2013, title: "Mangalyaan (MOM)", desc: "India reaches Mars orbit on first attempt", agency: "ISRO", 
    longDesc: "ISRO made history by becoming the first Asian nation to reach Martian orbit and the first nation in the world to do so on its maiden attempt.", 
    imageUrl: "/images/mangalyaan_mars_1780397148395.png" },
  { year: 2015, title: "Falcon 9 Landing", desc: "First orbital booster landing (SpaceX)", agency: "SpaceX", 
    longDesc: "SpaceX successfully landed the first stage of a Falcon 9 orbital rocket back on Earth, revolutionizing the aerospace industry by making rapid reusability a reality.", 
    imageUrl: "/images/falcon_9_1780397166285.png" },
  { year: 2017, title: "PSLV-C37", desc: "Record 104 satellites in one flight (ISRO)", agency: "ISRO", 
    longDesc: "ISRO set a monumental world record by successfully launching 104 satellites into orbit on a single PSLV rocket flight, demonstrating unmatched commercial efficiency.", 
    imageUrl: "/images/pslv_c37_1780397180673.png" },
  { year: 2021, title: "James Webb", desc: "Next-gen space telescope launched (NASA/ESA)", agency: "NASA", 
    longDesc: "The James Webb Space Telescope, the most powerful telescope ever built, was launched to observe the first galaxies formed after the Big Bang and search for exoplanets.", 
    imageUrl: "/images/james_webb_1780397196377.png" },
  { year: 2023, title: "Chandrayaan-3", desc: "First landing on Lunar South Pole (ISRO)", agency: "ISRO", 
    longDesc: "India successfully soft-landed the Vikram lander near the unexplored lunar south pole, solidifying ISRO's position as a dominant global space power.", 
    imageUrl: "/images/chandrayaan_3_1780397210207.png" }
];

export default function HistoricalTimeline({ AGENCY_COLORS }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  return (
    <div className="w-full mt-6 mb-2">
      <h3 className="text-sm font-semibold text-space-400 mb-4 uppercase tracking-widest px-2">World & India Space Milestones</h3>
      <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar px-2 snap-x">
        {EVENTS.map((evt, idx) => {
          const color = AGENCY_COLORS[evt.agency] || AGENCY_COLORS.Other;
          const isSelected = selectedEvent && selectedEvent.title === evt.title;
          
          return (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedEvent(isSelected ? null : evt)}
              className={`flex-shrink-0 w-64 glass-card p-4 border-l-4 snap-start cursor-pointer transition-colors group ${isSelected ? 'bg-space-800 ring-2 ring-space-400' : 'hover:bg-space-800'}`}
              style={{ borderLeftColor: color }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl font-bold font-display" style={{ color }}>{evt.year}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-space-900 border border-space-600 text-space-300 group-hover:border-space-400 transition-colors">
                  {evt.agency}
                </span>
              </div>
              <h4 className="text-white font-semibold mb-1">{evt.title}</h4>
              <p className="text-xs text-space-400 leading-relaxed">{evt.desc}</p>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="glass-card mt-2 p-1 border border-space-600 relative overflow-hidden flex flex-col md:flex-row">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-space-900/80 hover:bg-space-800 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="md:w-1/3 h-48 md:h-auto relative bg-space-900">
                <img 
                  src={selectedEvent.imageUrl} 
                  alt={selectedEvent.title} 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-space-900/90 to-transparent" />
              </div>
              
              <div className="p-8 md:w-2/3 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-display font-bold" style={{ color: AGENCY_COLORS[selectedEvent.agency] || AGENCY_COLORS.Other }}>
                    {selectedEvent.year}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border" style={{ borderColor: AGENCY_COLORS[selectedEvent.agency] || AGENCY_COLORS.Other, color: AGENCY_COLORS[selectedEvent.agency] || AGENCY_COLORS.Other }}>
                    {selectedEvent.agency}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{selectedEvent.title}</h3>
                <p className="text-space-300 leading-relaxed text-sm md:text-base max-w-3xl">
                  {selectedEvent.longDesc}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
