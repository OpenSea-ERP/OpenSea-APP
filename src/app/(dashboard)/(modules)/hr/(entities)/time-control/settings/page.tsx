'use client';

import { redirect } from 'next/navigation';

export default function PunchConfigSettingsRedirect() {
  redirect('/hr/settings?tab=ponto');
}
