import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Activity, CheckCircle2 } from 'lucide-react';
import type { Token } from '@/types/database';
import { formatChiefComplaintForQueue } from '@/utils/chiefComplaintDisplay';

interface VirtualWaitingRoomProps {
  currentToken: Token | null;
  activeToken: Token | null;
  queuePosition: number | null;
  estimatedWaitTime: number;
  queueData: Token[];
  loading?: boolean;
}

export function VirtualWaitingRoom({
  currentToken,
  activeToken,
  queuePosition,
  estimatedWaitTime,
  queueData,
  loading = false,
}: VirtualWaitingRoomProps) {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Token Status */}
      {currentToken && (
        <Card className="p-6 border-2 border-primary">
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Token Number</p>
              <div className="text-6xl font-bold text-primary">
                {currentToken.token_number}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant={currentToken.status === 'Active' ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                {currentToken.status === 'Active' ? (
                  <>
                    <Activity className="mr-2 h-5 w-5 animate-pulse" />
                    Your Turn - Please Proceed
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-5 w-5" />
                    Waiting in Queue
                  </>
                )}
              </Badge>
            </div>

            {currentToken.status === 'Waiting' && queuePosition && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Position: #{queuePosition}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Wait Time: ~{formatTime(estimatedWaitTime)}</span>
                  </div>
                </div>
                
                {queuePosition > 0 && (
                  <div className="space-y-1">
                    <Progress value={(queueData.length - queuePosition + 1) / queueData.length * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {queuePosition - 1} patient{queuePosition > 2 ? 's' : ''} ahead of you
                    </p>
                  </div>
                )}
              </div>
            )}

            {(currentToken.chief_complaint || (currentToken.symptoms?.length ?? 0) > 0) && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-left">
                <p className="text-xs text-muted-foreground mb-1">Reason for Visit</p>
                <p className="text-sm">
                  {formatChiefComplaintForQueue(currentToken.chief_complaint, currentToken.symptoms)}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Currently Serving */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Currently Serving
        </h3>
        
        <div className="text-center">
          {activeToken ? (
            <div className="space-y-2">
              <div className="text-5xl font-bold text-green-600 animate-pulse">
                {activeToken.token_number}
              </div>
              <Badge variant="default" className="text-base">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                In Progress
              </Badge>
              {activeToken.visit_type && (
                <p className="text-sm text-muted-foreground mt-2">
                  {activeToken.visit_type}
                </p>
              )}
            </div>
          ) : (
            <div className="text-gray-400 py-8">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No patient currently being served</p>
            </div>
          )}
        </div>
      </Card>

      {/* Queue Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Queue Status
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{queueData.length}</div>
            <p className="text-sm text-muted-foreground">Waiting</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{activeToken ? 1 : 0}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">
              {formatTime(queueData.length * 5)}
            </div>
            <p className="text-sm text-muted-foreground">Total Wait</p>
          </div>
        </div>
      </Card>

      {/* Upcoming Tokens (for staff view) */}
      {queueData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Next in Queue</h3>
          <div className="space-y-2">
            {queueData.slice(0, 5).map((token, index) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{token.token_number}</p>
                    {(token.chief_complaint || (token.symptoms?.length ?? 0) > 0) && (
                      <p className="text-xs text-muted-foreground truncate max-w-[220px] sm:max-w-xs">
                        {formatChiefComplaintForQueue(token.chief_complaint, token.symptoms)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{token.visit_type || 'General'}</Badge>
              </div>
            ))}
          </div>
          
          {queueData.length > 5 && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              +{queueData.length - 5} more in queue
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
