import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Printer, RotateCcw, Stethoscope, Users, Ticket, Calendar } from 'lucide-react';
import type { Patient, Token } from '@/types/database';

interface TokenConfirmationScreenProps {
  patient: Patient;
  token: Token;
  isNewPatient: boolean;
  suggestedDoctor?: string;
  onPrintToken?: () => void;
  onRegisterAnother?: () => void;
  onClose?: () => void;
}

export const TokenConfirmationScreen: React.FC<TokenConfirmationScreenProps> = ({
  patient,
  token,
  isNewPatient,
  suggestedDoctor,
  onPrintToken,
  onRegisterAnother,
  onClose,
}) => {
  const handlePrint = () => {
    if (onPrintToken) {
      onPrintToken();
    } else {
      // Browser print dialog
      window.print();
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Banner */}
        <div className="text-center space-y-2 animate-fade-in">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800">Patient Registered Successfully!</h1>
          <p className="text-gray-600">
            {isNewPatient ? 'New patient record created' : 'Patient record updated'} • Token generated
          </p>
        </div>

        {/* Main Token Card */}
        <Card className="bg-white border-2 border-green-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">AAROGYA SETU - REGISTRATION TOKEN</span>
              <Badge className="bg-white text-green-600 font-bold">
                {isNewPatient ? 'NEW PATIENT' : 'RETURNING PATIENT'}
              </Badge>
            </div>
            <div className="text-sm opacity-90">{dateStr}</div>
          </div>

          {/* Token Number - Large Display */}
          <div className="p-8 bg-gradient-to-b from-gray-50 to-white border-b-2 border-green-100 text-center">
            <p className="text-gray-500 text-sm mb-2">Token Number</p>
            <div className="text-6xl font-bold text-green-600 font-mono tracking-wider">
              {token.token_number}
            </div>
          </div>

          {/* Patient & Token Details */}
          <div className="p-6 space-y-6">
            {/* Patient Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800 text-sm">PATIENT DETAILS</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Patient ID</p>
                    <p className="font-mono font-bold text-lg text-gray-900">{patient.patient_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Full Name</p>
                    <p className="font-semibold text-gray-900">{patient.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Mobile Number</p>
                    <p className="font-mono text-gray-900">{patient.phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <p className="text-xs text-gray-600">Age</p>
                      <p className="font-semibold text-gray-900">{patient.age} yrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Gender</p>
                      <p className="font-semibold text-gray-900">{patient.gender}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Details Section */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-800 text-sm">VISIT DETAILS</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Purpose of Visit</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {token.purpose_of_visit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Visit Date</p>
                    <p className="font-semibold text-gray-900">{dateStr}</p>
                  </div>
                  {token.billing_type && (
                    <div>
                      <p className="text-xs text-gray-600">Billing Type</p>
                      <p className="font-semibold text-gray-900">{token.billing_type}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                      {token.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Suggestion */}
            {suggestedDoctor && (
              <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm mb-1">Suggested Doctor Specialty</p>
                    <p className="text-lg font-bold text-amber-900">{suggestedDoctor}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Assigned based on purpose of visit analysis
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Important Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">INSTRUCTIONS</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Please keep your token number safe</li>
                <li>• Check-in at the counter when called</li>
                <li>• Arrive on time for your appointment</li>
                {isNewPatient && (
                  <li>• Your patient account is now active - login with mobile & OTP</li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-3 border-t text-xs text-gray-600 text-center">
            Thank you for using Aarogya Setu • Hospital Management System
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="h-12 text-base font-semibold gap-2"
          >
            <Printer className="h-5 w-5" />
            Print Token
          </Button>

          <Button
            onClick={onRegisterAnother}
            className="h-12 text-base font-semibold gap-2 gradient-primary text-white"
          >
            <RotateCcw className="h-5 w-5" />
            Register Another
          </Button>

          <Button
            onClick={onClose}
            variant="secondary"
            className="h-12 text-base font-semibold"
          >
            Done
          </Button>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              background: white;
            }
            * {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TokenConfirmationScreen;
