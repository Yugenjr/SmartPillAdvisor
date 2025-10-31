import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string | undefined;
const dbName = process.env.DB_NAME as string | undefined;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  // In-memory safe fallback if env not provided yet
  if (!uri || !dbName) {
    const memory: Record<string, any[]> = { medicines: [], interactions: [] };
    return {
      client: null as unknown as MongoClient,
      db: {
        collection(name: string) {
          return {
            find(query: any) {
              const data = memory[name] || [];
              const res = data.filter((doc: any) =>
                Object.keys(query || {}).every((k) => doc[k] === query[k])
              );
              return { toArray: async () => res };
            },
            insertOne(doc: any) {
              if (!memory[name]) memory[name] = [];
              const id = `${name}_${Date.now()}`;
              memory[name].push({ _id: id, ...doc });
              return Promise.resolve({ insertedId: id });
            },
          } as any;
        },
      } as unknown as Db,
    };
  }

  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}
