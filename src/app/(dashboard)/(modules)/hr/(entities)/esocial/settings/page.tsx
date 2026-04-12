'use client';

import { redirect } from 'next/navigation';

export default function EsocialSettingsRedirect() {
  redirect('/hr/settings?tab=esocial');
}
