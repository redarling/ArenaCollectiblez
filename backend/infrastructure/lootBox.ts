import 'server-only';
import { err, ok, Result } from 'neverthrow';
import { db } from '../database/connection';
import { LootBoxType, lootBox, lootBoxPending } from '../database/schema';
import { and, eq } from 'drizzle-orm';

export async function addLootBoxToUser(
  userId: string,
  type: LootBoxType,
): Promise<Result<boolean, Error>> {
  try {
    let image: string;
    if (type === LootBoxType.BlazehartSC) {
      image = 'https://i.postimg.cc/8czTKbV9/loot-Box-Blaze-Heart.png';
    } else {
      image = 'https://i.postimg.cc/ydVKxTWx/loot-Box-Storm-Fox.png';
    }

    const pendingLootBox = await getPendingLootBox(userId);
    if (pendingLootBox.isErr() || !pendingLootBox.value) {
      return err(new Error('No pending loot box found for user'));
    } else {
      await removePendingLootBox(userId);
    }

    await db.insert(lootBox).values({
      id: crypto.randomUUID(),
      name: 'Stormfox FC vs. Blazehart SC',
      user_id: userId,
      description:
        'Exclusive loot box for Stormfox FC vs. Blazehart SC 2025 match.',
      image: image,
      type: type,
      price_to_open: 1,
      createdAt: new Date().toISOString(),
    });
    return ok(true);
  } catch (error) {
    console.error('Error getting or creating user:', error);
    return err(new Error('Failed to get or create user'));
  }
}

export async function addPendingLootBox(
  userId: string,
): Promise<Result<boolean, Error>> {
  try {
    await db.insert(lootBoxPending).values({
      id: crypto.randomUUID(),
      user_id: userId,
    });
    return ok(true);
  } catch (error) {
    console.error('Error adding pending loot box:', error);
    return err(new Error('Failed to add pending loot box'));
  }
}

export async function removePendingLootBox(
  userId: string,
): Promise<Result<boolean, Error>> {
  try {
    await db.delete(lootBoxPending).where(eq(lootBoxPending.user_id, userId));

    return ok(true);
  } catch (error) {
    console.error('Error removing pending loot box:', error);
    return err(new Error('Failed to remove pending loot box'));
  }
}

export async function getPendingLootBox(
  userId: string,
): Promise<Result<boolean, Error>> {
  try {
    const pendingLootBox = await db.query.lootBoxPending.findFirst({
      where: (table, { eq }) => eq(table.user_id, userId),
    });

    if (pendingLootBox) {
      return ok(true);
    } else {
      return ok(false);
    }
  } catch (error) {
    console.error('Error checking pending loot box:', error);
    return err(new Error('Failed to check pending loot box'));
  }
}

export async function deleteLootBoxById(
  userId: string,
  lootBoxId: string,
): Promise<Result<boolean, Error>> {
  try {
    const result = await db
      .delete(lootBox)
      .where(and(eq(lootBox.id, lootBoxId), eq(lootBox.user_id, userId))).returning();

    if (result.length === 0) {
      return err(new Error('No loot box found with the given ID'));
    }

    return ok(true);
  } catch (error) {
    console.error('Error deleting loot box:', error);
    return err(new Error('Failed to delete loot box'));
  }
}
