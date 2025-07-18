import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { addPendingLootBox } from '../../../../backend/infrastructure/lootBox';
import { veriftUer } from '../../../../backend/infrastructure/user';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_BASE_URL is not defined');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cookieStore = await cookies();
  const { code, userId } = body;
  const wallet = cookieStore.get('wallet')?.value;

  if (code.trim() !== process.env.LOOT_BOX_SECRET?.trim()) {
    console.error('Invalid QR code:', code);
    console.log('Expected:', process.env.LOOT_BOX_SECRET);
    console.log('Received:', code);
    return NextResponse.json({ error: 'Invalid QR' }, { status: 400 });
  }

  if (!wallet) {
    console.error('Wallet not found in cookies');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const verify = await veriftUer(userId, wallet);
  if (verify.isErr()) {
    console.error('Failed to verify user:', verify.error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const addLootBoxPending = await addPendingLootBox(userId);
  if (addLootBoxPending.isErr()) {
    console.error('Failed to add pending loot box:', addLootBoxPending.error);
    return NextResponse.json(
      { error: 'Failed to add pending loot box' },
      { status: 500 },
    );
  }

  const triggerLootBox = await fetch(`${baseUrl}/api/trigger-loot-box-receive/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  if (!triggerLootBox.ok) {
    console.error('Failed to trigger loot box receive:', await triggerLootBox.text());
    return NextResponse.json(
      { error: 'Failed to trigger loot box receive' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true },
    {
      status: 200,
    },
  );
}
