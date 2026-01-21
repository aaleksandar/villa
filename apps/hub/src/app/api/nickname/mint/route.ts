import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { getDb, ensureTables, isDatabaseAvailable } from "@/lib/db";
import type { ProfileRow } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const NICKNAME_RESOLVER_V3_ABI = [
  {
    name: "mintNickname",
    type: "function",
    inputs: [
      { name: "user", type: "address" },
      { name: "nickname", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "hasMinted",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "isNicknameAvailable",
    type: "function",
    inputs: [{ name: "nickname", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const mintSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/i),
  nickname: z.string().min(3).max(20),
  signature: z.string().optional(),
});

function getChainConfig() {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId === "8453"
    ? {
        chain: base,
        rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      }
    : {
        chain: baseSepolia,
        rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      };
}

function getContractAddress(): `0x${string}` {
  const address = process.env.NICKNAME_RESOLVER_V3_ADDRESS;
  if (!address) {
    throw new Error("NICKNAME_RESOLVER_V3_ADDRESS not configured");
  }
  return address as `0x${string}`;
}

function getMinterAccount() {
  const privateKey = process.env.MINTER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("MINTER_PRIVATE_KEY not configured");
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
}

export async function POST(request: Request) {
  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { error: "Database not available" },
      { status: 503 },
    );
  }

  try {
    await ensureTables();

    const body = await request.json();
    const parsed = mintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const { address, nickname } = parsed.data;
    const normalizedAddress = address.toLowerCase() as `0x${string}`;
    const normalizedNickname = nickname.toLowerCase();

    const sql = getDb();

    const profile = await sql<ProfileRow[]>`
      SELECT * FROM profiles
      WHERE LOWER(address) = ${normalizedAddress}
      LIMIT 1
    `;

    if (profile.length === 0) {
      return NextResponse.json(
        { error: "Profile not found. Create a profile first." },
        { status: 404 },
      );
    }

    const { chain, rpcUrl } = getChainConfig();
    const contractAddress = getContractAddress();

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const hasMinted = await publicClient.readContract({
      address: contractAddress,
      abi: NICKNAME_RESOLVER_V3_ABI,
      functionName: "hasMinted",
      args: [normalizedAddress],
    });

    if (hasMinted) {
      return NextResponse.json(
        { error: "Address has already minted a nickname" },
        { status: 409 },
      );
    }

    const isAvailable = await publicClient.readContract({
      address: contractAddress,
      abi: NICKNAME_RESOLVER_V3_ABI,
      functionName: "isNicknameAvailable",
      args: [normalizedNickname],
    });

    if (!isAvailable) {
      return NextResponse.json(
        { error: "Nickname is already taken on-chain" },
        { status: 409 },
      );
    }

    const minterAccount = getMinterAccount();

    const walletClient = createWalletClient({
      account: minterAccount,
      chain,
      transport: http(rpcUrl),
    });

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: NICKNAME_RESOLVER_V3_ABI,
      functionName: "mintNickname",
      args: [normalizedAddress, normalizedNickname],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction failed" },
        { status: 500 },
      );
    }

    await sql`
      UPDATE profiles SET
        onchain_minted = true,
        mint_tx_hash = ${hash},
        updated_at = NOW()
      WHERE LOWER(address) = ${normalizedAddress}
    `;

    return NextResponse.json({
      success: true,
      txHash: hash,
      nickname: normalizedNickname,
      chainId: chain.id,
    });
  } catch (error) {
    console.error("Nickname mint error:", error);

    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json(
        { error: "Minting service not configured" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Failed to mint nickname" },
      { status: 500 },
    );
  }
}
