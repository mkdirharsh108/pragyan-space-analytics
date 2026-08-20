import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Globe from 'react-globe.gl';
import { Orbit, Activity, Target, XSquare, ChevronDown } from 'lucide-react';
import * as THREE from 'three';

const EARTH_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_TOPOLOGY = 'https://unpkg.com/three-globe/example/img/earth-topology.png';

const AGENCY_COLORS = { 
  'NASA': '#2196F3', 
  'SpaceX': '#FF5722', 
  'ISRO': '#FFC107', 
  'Roscosmos': '#F44336', 
  'CNSA': '#9C27B0', 
  'ESA': '#4CAF50', 
  'Other': '#9E9E9E'
};

const FILTER_OPTIONS = [
  { value: 'All', label: 'All Payloads' },
  { value: 'SpaceX', label: 'SpaceX' },
  { value: 'NASA', label: 'NASA' },
  { value: 'ISRO', label: 'ISRO' },
  { value: 'ESA', label: 'ESA' },
  { value: 'Debris', label: 'Space Debris' },
];

const CustomDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 bg-transparent text-white font-bold text-sm outline-none cursor-pointer uppercase tracking-widest"
      >
        {selectedOption.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-4 left-0 bg-[#0B0D10]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.8)] min-w-[200px] overflow-hidden flex flex-col z-[500]">
          {options.map(opt => (
            <button 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-colors border-l-2 ${value === opt.value ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white hover:border-white/30'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Pre-allocate geometries and materials globally so we don't crash WebGL
const sharedGeometry = new THREE.IcosahedronGeometry(1, 1); // low poly sphere
const sharedMaterials = {
  'NASA': new THREE.MeshBasicMaterial({ color: AGENCY_COLORS.NASA }),
  'SpaceX': new THREE.MeshBasicMaterial({ color: AGENCY_COLORS.SpaceX }),
  'ISRO': new THREE.MeshBasicMaterial({ color: AGENCY_COLORS.ISRO }),
  'Roscosmos': new THREE.MeshBasicMaterial({ color: AGENCY_COLORS.Roscosmos }),
  'CNSA': new THREE.MeshBasicMaterial({ color: AGENCY_COLORS.CNSA }),
  'ESA': new THREE.MeshBasicMaterial({ color: AGENCY_COLORS.ESA }),
  'Other': new THREE.MeshBasicMaterial({ color: AGENCY_COLORS.Other }),
  'Debris': new THREE.MeshBasicMaterial({ color: '#ef4444' })
};

export default function LiveOrbitalMap({ allData = [], onClose }) {
  const globeRef = useRef();
  const [satellites, setSatellites] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [localFilter, setLocalFilter] = useState('All');
  const [isRotating, setIsRotating] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(1);

  const TUTORIAL_STEPS = [
    {
      title: "Welcome to Live Orbit",
      text: "Welcome to Live Orbit. A real-time, mathematically accurate simulation of active payloads. Let's begin the tour.",
      positionClass: "m-auto",
      arrowClass: "hidden"
    },
    {
      title: "Orbital Navigation",
      text: "Drag to rotate the Earth. Use the scroll wheel to zoom through the orbital layers.",
      positionClass: "mx-auto mt-auto mb-10",
      arrowClass: "bottom-full left-1/2 -translate-x-1/2 border-b-cyan-500/50 border-t-transparent border-l-transparent border-r-transparent border-[12px]"
    },
    {
      title: "Mission Filters",
      text: "Filter the airspace by agency, or isolate and track active orbital debris from the top menu.",
      positionClass: "ml-auto mr-[120px] mt-20",
      arrowClass: "bottom-full right-[320px] border-b-cyan-500/50 border-t-transparent border-l-transparent border-r-transparent border-[12px]"
    },
    {
      title: "Time & Rotation",
      text: "Use the simulation toggle to pause or resume real-time planetary and satellite rotation.",
      positionClass: "ml-auto mr-12 mt-20",
      arrowClass: "bottom-full right-[140px] border-b-cyan-500/50 border-t-transparent border-l-transparent border-r-transparent border-[12px]"
    },
    {
      title: "Target Lock & Telemetry",
      text: "Hover to intercept live telemetry. Click any satellite to engage target-lock and track its trajectory.",
      positionClass: "ml-auto mr-12 my-auto",
      arrowClass: "right-full top-1/2 -translate-y-1/2 border-r-cyan-500/50 border-t-transparent border-b-transparent border-l-transparent border-[12px]"
    }
  ];

  // LAUNCH_SITES removed because it was unused
  const containerRef = useRef();
  const isPausedRef = useRef(false);
  const selectedSatelliteRef = useRef(null);
  const swoopEndTimeRef = useRef(0);

  useEffect(() => {
    selectedSatelliteRef.current = selectedSatellite;
  }, [selectedSatellite]);

  // Resize observer for responsive globe
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setDimensions({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Generate satellite and arc data from actual database
  useEffect(() => {
    if (!allData || allData.length === 0) return;
    
    const sats = [];
    
    // Render filtered data points
    allData.forEach((row, idx) => {
      const isSuccess = row.is_success === 1;
      const agency = row.dashboard_agency || 'Other';
      
      if (localFilter !== 'All') {
        if (localFilter === 'Debris' && isSuccess) return; // Skip successful missions if filtering for Debris
        if (localFilter !== 'Debris' && agency !== localFilter) return; // Skip if agency doesn't match
        if (localFilter !== 'Debris' && !isSuccess) return; // Don't show debris when filtering by specific agency
      }

      const color = AGENCY_COLORS[agency] || AGENCY_COLORS.Other;
      
      // Procedural Realistic Orbit Generation
      // Distribute payloads into realistic orbital regimes based on agency
      let lat, lng, alt, radius, speed;
      
      const seedLng = (idx * 13.37) % 360; // Spread evenly around the globe
      
      if (!isSuccess) {
        // Debris: Chaotic, highly elliptical, very low orbit, decaying fast
        alt = 0.02 + ((idx % 50) / 50) * 0.05; 
        lat = (idx * 42.1) % 180 - 90;
        lng = seedLng;
        radius = 0.15;
        speed = 0.08 + ((idx % 10) / 10) * 0.04; // Slower debris
      } 
      else if (agency === 'SpaceX' || agency === 'Other') {
        // LEO (Low Earth Orbit) - e.g. Starlink
        // Very low altitude, fast moving, ~53 degree inclination
        alt = 0.1;
        lat = ((idx * 7.7) % 106) - 53; 
        lng = seedLng;
        radius = 0.18;
        speed = 0.05; // Slower LEO
      } 
      else if (agency === 'NASA' || agency === 'ISRO') {
        // Polar / Sun-Synchronous Orbits
        // Passes directly over the poles, medium-low altitude
        alt = 0.25;
        lat = ((idx * 15.1) % 180) - 90; // Full -90 to 90 sweep
        lng = seedLng;
        radius = 0.22;
        // In polar orbit, lat changes more than lng. We simulate this by making lng slow
        // and later we could animate lat, but for now we keep the same animation logic
        speed = 0.03; // Slower Polar
      } 
      else {
        // GEO (Geosynchronous) - e.g. Telecom, ESA, Roscosmos
        // High altitude (35,786 km), zero inclination (equator), matches Earth rotation
        alt = 0.8;
        lat = ((idx * 3.3) % 4) - 2; // Tightly bound to equator (-2 to +2 degrees)
        lng = seedLng;
        radius = 0.3;
        speed = 0.005; // Very slow GEO
      }
      
      const sat = {
        id: `M-${row.id || idx}`,
        mission: row.mission,
        agency: agency,
        rocket: row.rocket_type,
        year: row.year,
        isSuccess: isSuccess,
        lat, lng, alt, radius, speed,
        color: isSuccess ? color : '#ef4444', // Red if debris
      };
      sats.push(sat);
    });

    setTimeout(() => setSatellites(sats), 0);
  }, [allData, localFilter]);

  // Animation Loop for Satellite Orbits
  useEffect(() => {
    let animationFrame;
    const animate = () => {
      setSatellites(prev => {
        const next = prev.map(sat => ({
          ...sat,
          lng: !isPausedRef.current ? (sat.lng >= 180 ? -180 : sat.lng + sat.speed) : sat.lng
        }));

        // Cinematic Follow Camera
        const targetId = selectedSatelliteRef.current?.id;
        if (targetId && globeRef.current) {
          const targetSat = next.find(s => s.id === targetId);
          if (targetSat && Date.now() > swoopEndTimeRef.current) {
            // Only update lat/lng so user can freely zoom with mouse wheel
            globeRef.current.pointOfView({ 
              lat: targetSat.lat, 
              lng: targetSat.lng 
            }, 0); // 0 transition for smooth real-time tracking
          }
        }
        return next;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);



  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = isRotating && !selectedSatellite;
    }
  }, [isRotating, selectedSatellite]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black overflow-hidden">
      
      {/* Sleek Floating Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex flex-col md:flex-row justify-between items-start pointer-events-none">
        <div className="flex items-center gap-4">
          <Orbit className="w-10 h-10 text-agency-spacex animate-[spin_10s_linear_infinite] drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          <div>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight drop-shadow-lg">Global Orbital Tracking</h2>
            <p className="text-space-300 text-sm mt-1 drop-shadow-md tracking-wider uppercase font-semibold">Live Simulation Active</p>
          </div>
        </div>
        
        <div className="flex gap-4 pointer-events-auto mt-4 md:mt-0">
          <div className="glass-panel px-4 py-2 flex items-center border border-white/10 backdrop-blur-md bg-black/40">
            <CustomDropdown 
              value={localFilter} 
              onChange={setLocalFilter} 
              options={FILTER_OPTIONS} 
            />
          </div>
          <div className="glass-panel px-4 py-2 flex flex-col items-end border border-white/10 backdrop-blur-md bg-black/40">
            <span className="text-xs text-space-400 uppercase tracking-widest">Tracked Objects</span>
            <span className="text-xl font-bold text-cyan-400">{satellites.length.toLocaleString()}</span>
          </div>
          <div className="glass-panel px-4 py-2 flex flex-col items-end border border-white/10 backdrop-blur-md bg-black/40">
            <span className="text-xs text-space-400 uppercase tracking-widest">Rotation</span>
            <button 
              onClick={() => setIsRotating(!isRotating)}
              className={`text-xl font-bold flex items-center gap-2 ${isRotating ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              <Activity className="w-4 h-4" /> {isRotating ? 'ACTIVE' : 'PAUSED'}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl backdrop-blur-md transition-colors pointer-events-auto"
          >
            <XSquare className="w-5 h-5" /> CLOSE
          </button>
        </div>
      </div>

      {/* Interactive Step-by-Step Tutorial Modal */}
      {tutorialStep > 0 && (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col p-6 overflow-hidden">
          <motion.div 
            layout
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className={`glass-card p-8 max-w-md w-full border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.2)] pointer-events-auto relative ${TUTORIAL_STEPS[tutorialStep - 1].positionClass}`}
          >
            {/* The Pointer Arrow */}
            <div className={`absolute w-0 h-0 border-solid ${TUTORIAL_STEPS[tutorialStep - 1].arrowClass}`}></div>
            <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-space-900 border border-cyan-500/50 text-cyan-400 font-bold text-sm shadow-xl">
              {tutorialStep}/{TUTORIAL_STEPS.length}
            </div>
            
            <h3 className="text-2xl font-display font-bold text-white mb-3">
              {TUTORIAL_STEPS[tutorialStep - 1].title}
            </h3>
            
            <p className="text-space-300 mb-8 leading-relaxed">
              {TUTORIAL_STEPS[tutorialStep - 1].text}
            </p>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <button 
                onClick={() => setTutorialStep(0)}
                className="text-space-400 hover:text-white text-sm font-semibold transition-colors uppercase tracking-wider"
              >
                Skip Tutorial
              </button>
              
              <button 
                onClick={() => {
                  if (tutorialStep < TUTORIAL_STEPS.length) {
                    setTutorialStep(tutorialStep + 1);
                  } else {
                    setTutorialStep(0);
                  }
                }}
                className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/50 rounded-lg font-bold transition-colors uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                {tutorialStep === TUTORIAL_STEPS.length ? "Commence" : "Next"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main 3D Context (Full Screen) */}
      <div className="w-full h-screen relative" ref={containerRef}>
        
        {/* Absolute Legend */}
        <div className="absolute top-28 left-6 z-10 glass-panel p-4 flex flex-col gap-3 border border-white/10 backdrop-blur-md bg-black/40">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-2 mb-1">Active Agencies</h4>
          {Object.entries(AGENCY_COLORS).map(([agency, color]) => (
            <LegendItem key={agency} color={color} label={agency} />
          ))}
          <div className="mt-2 pt-2 border-t border-white/10">
             <LegendItem color="#ef4444" label="Debris (Failed)" />
          </div>
        </div>

        {/* Target Lock HUD */}
        {selectedSatellite && (
          <div className="absolute bottom-6 right-6 z-10 glass-panel p-5 border border-red-500/50 backdrop-blur-md min-w-[250px] shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="flex justify-between items-start border-b border-red-500/30 pb-2 mb-3">
              <div className="flex items-center gap-2 text-red-400">
                <Target className="w-5 h-5 animate-[spin_4s_linear_infinite]" />
                <span className="font-display font-bold tracking-widest uppercase">Target Lock</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedSatellite(null);
                  setIsRotating(true);
                }}
                className="text-space-400 hover:text-white"
              >
                <XSquare className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="text-space-400">Mission:</span> <span className="text-white font-mono">{selectedSatellite.mission}</span></div>
              <div className="flex justify-between"><span className="text-space-400">Vehicle:</span> <span className="text-cyan-400">{selectedSatellite.rocket}</span></div>
              <div className="flex justify-between"><span className="text-space-400">Agency:</span> <span className="text-amber-400">{selectedSatellite.agency}</span></div>
              <div className="flex justify-between"><span className="text-space-400">Year:</span> <span className="text-emerald-400 font-mono">{selectedSatellite.year}</span></div>
              <div className="flex justify-between"><span className="text-space-400">Status:</span> <span className={`${selectedSatellite.isSuccess ? 'text-emerald-400' : 'text-red-400'} font-bold`}>{selectedSatellite.isSuccess ? 'NOMINAL' : 'DEBRIS'}</span></div>
            </div>
          </div>
        )}

        {/* The Globe */}
        <div 
          className="w-full h-full cursor-move"
          onPointerDown={() => isPausedRef.current = true}
          onPointerUp={() => isPausedRef.current = false}
          onPointerLeave={() => isPausedRef.current = false}
        >
          {dimensions.width > 0 && (
            <Globe
              ref={globeRef}
              width={dimensions.width}
              height={dimensions.height}
              globeImageUrl={EARTH_TEXTURE}
              bumpImageUrl={EARTH_TOPOLOGY}
              backgroundColor="rgba(0,0,0,0)"
              
              // Satellites as 3D Floating Spheres
              objectsData={satellites}
              objectLat="lat"
              objectLng="lng"
              objectAltitude="alt"
              objectThreeObject={(d) => {
                const isSelected = selectedSatellite && selectedSatellite.id === d.id;
                const scale = isSelected ? 0.8 : (d.radius * 2);
                const matName = isSelected ? 'Debris' : (d.isSuccess ? (sharedMaterials[d.agency] ? d.agency : 'Other') : 'Debris');
                
                const mesh = new THREE.Mesh(sharedGeometry, sharedMaterials[matName]);
                mesh.scale.set(scale, scale, scale);
                return mesh;
              }}
              
              // Atmospherics
              atmosphereColor="#3b82f6"
              atmosphereAltitude={0.15}
              
              onGlobeReady={() => {
                if (globeRef.current && !globeRef.current.__lightingConfigured) {
                  globeRef.current.controls().autoRotateSpeed = 0.2;
                  globeRef.current.pointOfView({ altitude: 2.5 });
                  const scene = globeRef.current.scene();
                  const lights = scene.children.filter(c => c.type.includes('Light'));
                  lights.forEach(l => scene.remove(l));
                  scene.add(new THREE.AmbientLight(0xffffff, 0.1));
                  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
                  sunLight.position.set(5, 3, 5);
                  scene.add(sunLight);
                  globeRef.current.__lightingConfigured = true;
                }
              }}
              
              // Interactions
              onGlobeClick={() => setIsRotating(false)}
              onBackgroundClick={() => setIsRotating(false)}
              onObjectClick={(point) => {
                setSelectedSatellite(point);
                setIsRotating(false);
                swoopEndTimeRef.current = Date.now() + 1500;
                if (globeRef.current) {
                  globeRef.current.controls().autoRotate = false;
                  // Trigger smooth cinematic swoop
                  globeRef.current.pointOfView({
                    lat: point.lat,
                    lng: point.lng,
                    altitude: point.alt + 0.4
                  }, 1500);
                }
              }}
              onObjectHover={() => {
                // Do nothing on hover, let it keep rotating smoothly!
              }}
              
              // Tooltips
              objectLabel={(d) => `
                <div class="glass-panel p-3 border border-white/20 min-w-[150px] shadow-2xl rounded-xl">
                  <div class="text-xs text-space-400 uppercase tracking-wider mb-1">${d.agency} • ${d.year}</div>
                  <div class="text-white font-bold mb-1">${d.mission}</div>
                  <div class="text-xs ${d.isSuccess ? 'text-emerald-400' : 'text-red-400'} font-bold mb-2">${d.isSuccess ? 'SUCCESS' : 'FAILURE'}</div>
                  <div class="text-xs text-slate-300">Vehicle: ${d.rocket}</div>
                  <div class="text-xs text-slate-300">Alt: ${(d.alt * 6371).toFixed(0)} km</div>
                  <div class="text-xs text-slate-300">Speed: ${(d.speed * 1000).toFixed(0)} km/h</div>
                </div>
              `}
            />
          )}
        </div>
        
        {/* Scanlines overlay for cyberpunk feel */}
        <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+Cjwvc3ZnPg==')] opacity-40 mix-blend-overlay" />
      </div>
    </motion.div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color: color }} />
      <span className="text-xs text-slate-300">{label}</span>
    </div>
  );
}
