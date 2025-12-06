import { useState } from 'react';
import { 
  Map as MapIcon, 
  MapPin, 
  Truck, 
  Navigation,
  Clock,
  Package,
  Route,
  Zap,
  ChevronRight
} from 'lucide-react';
import { CollectorNavbar } from '../layout/CollectorNavbar';
import { Badge } from '@/components/shared/Badge';
import { useToastNotification } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';

// Removed: interface PickupLocation

const mockLocations = [
  { id: 'PU-089', address: '123 Green St, Zone A', customer: 'Alex Green', items: 3, priority: 'high', zone: 'A', estimatedTime: '15 min', driver: 'Driver #1' },
  { id: 'PU-090', address: '456 Blue Ave, Zone B', customer: 'Sarah Blue', items: 1, priority: 'medium', zone: 'B', estimatedTime: '25 min', driver: 'Driver #2' },
  { id: 'PU-091', address: '789 Red Blvd, Zone C', customer: 'John Red', items: 2, priority: 'high', zone: 'C', estimatedTime: '35 min' },
  { id: 'PU-092', address: '321 Yellow Ln, Zone A', customer: 'Mike Yellow', items: 5, priority: 'low', zone: 'A', estimatedTime: '45 min' },
  { id: 'PU-093', address: '654 Purple Rd, Zone B', customer: 'Lisa Purple', items: 2, priority: 'medium', zone: 'B', estimatedTime: '55 min' },
];

const drivers = [
  { id: 1, name: 'Driver #1', status: 'active', zone: 'A', pickups: 4, completed: 2 },
  { id: 2, name: 'Driver #2', status: 'active', zone: 'B', pickups: 3, completed: 1 },
  { id: 3, name: 'Driver #3', status: 'idle', zone: '-', pickups: 0, completed: 5 },
];

const zones = [
  { id: 'A', name: 'Zone A', color: 'bg-generator-primary', pickups: 5, drivers: 1 },
  { id: 'B', name: 'Zone B', color: 'bg-collector-primary', pickups: 4, drivers: 1 },
  { id: 'C', name: 'Zone C', color: 'bg-yellow-500', pickups: 2, drivers: 0 },
];

export function LogisticsMap() {
  const { showToast } = useToastNotification();
  // Removed: Generics from useState
  const [locations] = useState(mockLocations);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  const optimizeRoutes = () => {
    setOptimizing(true);
    setTimeout(() => {
      const optimized = ['PU-089', 'PU-092', 'PU-090', 'PU-093', 'PU-091'];
      setOptimizedRoute(optimized);
      setOptimizing(false);
      showToast('success', 'Routes Optimized', 'Estimated time saved: 23 minutes');
    }, 2000);
  };

  const priorityColors = {
    high: 'bg-destructive/20 text-destructive border-destructive/30',
    medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    low: 'bg-generator-primary/20 text-generator-primary border-generator-primary/30',
  };

  return (
    <div>
      <CollectorNavbar title="Logistics Map" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-collector-primary" />
                Live Map View
              </h3>
              <button
                onClick={optimizeRoutes}
                disabled={optimizing}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                  'bg-gradient-collector text-primary-foreground hover:opacity-90',
                  optimizing && 'opacity-50 cursor-not-allowed'
                )}
              >
                {optimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Route className="w-4 h-4" />
                    Optimize Routes
                  </>
                )}
              </button>
            </div>

            {/* Mock Map */}
            <div className="relative w-full h-96 rounded-xl bg-muted/50 border border-border overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div key={i} className="border border-border/30" />
                ))}
              </div>

              {/* Zone Overlays */}
              <div className="absolute top-4 left-4 w-32 h-32 rounded-xl bg-generator-primary/10 border border-generator-primary/30 flex items-center justify-center">
                <span className="text-generator-primary font-bold text-lg">Zone A</span>
              </div>
              <div className="absolute top-4 right-4 w-32 h-32 rounded-xl bg-collector-primary/10 border border-collector-primary/30 flex items-center justify-center">
                <span className="text-collector-primary font-bold text-lg">Zone B</span>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <span className="text-yellow-500 font-bold text-lg">Zone C</span>
              </div>

              {/* Mock Pickup Pins */}
              {locations.map((location, index) => {
                const positions = [
                  { top: '15%', left: '15%' },
                  { top: '20%', left: '75%' },
                  { top: '70%', left: '45%' },
                  { top: '25%', left: '25%' },
                  { top: '30%', left: '80%' },
                ];
                const pos = positions[index % positions.length];
                return (
                  <div
                    key={location.id}
                    className={cn(
                      'absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-125 animate-pulse-glow',
                      location.priority === 'high' ? 'bg-destructive' :
                      location.priority === 'medium' ? 'bg-yellow-500' : 'bg-generator-primary'
                    )}
                    style={{ top: pos.top, left: pos.left }}
                    title={`${location.id} - ${location.customer}`}
                  >
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                );
              })}

              {/* Truck Icons */}
              <div className="absolute top-[20%] left-[20%] w-10 h-10 rounded-full bg-collector-primary flex items-center justify-center animate-float">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="absolute top-[25%] left-[70%] w-10 h-10 rounded-full bg-collector-primary flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                <Truck className="w-5 h-5 text-white" />
              </div>

              {/* Optimized Route Line */}
              {optimizedRoute && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d="M 80 80 L 120 120 L 320 100 L 350 140 L 250 300"
                    stroke="hsl(var(--collector-primary))"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    fill="none"
                    className="animate-fade-in"
                  />
                </svg>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-muted-foreground">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-generator-primary" />
                <span className="text-sm text-muted-foreground">Low Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-collector-primary" />
                <span className="text-sm text-muted-foreground">Active Driver</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Zone Summary */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-display font-semibold mb-4">Zone Summary</h3>
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-3 h-3 rounded-full', zone.color)} />
                      <span className="font-medium">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {zone.pickups}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {zone.drivers}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drivers */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-display font-semibold mb-4">Active Drivers</h3>
              <div className="space-y-3">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        driver.status === 'active' ? 'bg-collector-primary/20' : 'bg-muted'
                      )}>
                        <Truck className={cn(
                          'w-4 h-4',
                          driver.status === 'active' ? 'text-collector-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">{driver.zone !== '-' ? `Zone ${driver.zone}` : 'Idle'}</p>
                      </div>
                    </div>
                    <Badge variant={driver.status === 'active' ? 'collector' : 'default'} size="sm">
                      {driver.completed}/{driver.pickups}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Pickups List */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold">Pending Pickups</h3>
            {optimizedRoute && (
              <Badge variant="collector" icon={Zap}>Route Optimized</Badge>
            )}
          </div>
          <div className="space-y-3">
            {(optimizedRoute 
              // Removed: Type assertion
              ? optimizedRoute.map(id => locations.find(l => l.id === id))
              : locations
            ).map((location, index) => (
              <div
                key={location.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors',
                  'animate-fade-in opacity-0',
                  `stagger-${Math.min(index + 1, 5)}`
                )}
                style={{ animationFillMode: 'forwards' }}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  'bg-collector-primary/20 text-collector-primary'
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{location.id}</span>
                    <Badge variant={location.priority === 'high' ? 'error' : location.priority === 'medium' ? 'warning' : 'success'} size="sm">
                      {location.priority}
                    </Badge>
                  </div>
                  <p className="font-medium mt-1">{location.customer}</p>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {location.items} items
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {location.estimatedTime}
                  </p>
                </div>
                {location.driver && (
                  <Badge variant="collector" size="sm">{location.driver}</Badge>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}