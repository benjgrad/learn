"use client";

import { useState } from "react";
import { PURCHASE_TIERS, SPARK_CONFIG } from "@/lib/sparks/config";
import { useSparks } from "@/lib/sparks/use-sparks";
import { useCourseAccess } from "@/lib/sparks/use-course-access";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchaseModal } from "./PurchaseModal";
import { SparkPassCard } from "./SparkPassCard";
import type { SparkPurchaseTier } from "@/types/sparks";

function CourseItem({ courseId, price }: { courseId: string; price: number }) {
  const { hasAccess, unlock } = useCourseAccess(courseId);
  const { balance, refresh } = useSparks();
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setPending(true);
    setError(null);
    const result = await unlock(user?.id || "anon");
    if (result.success) {
      refresh();
    } else {
      setError(result.error ?? "Could not unlock this course.");
    }
    setPending(false);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div>
        <div className="font-medium capitalize">{courseId.replace(/-/g, " ")}</div>
        <div className="text-sm text-muted-foreground">
          {hasAccess ? "Unlocked" : `${price.toLocaleString()} Sparks`}
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
      {!hasAccess && (
        <Button
          onClick={handleUnlock}
          disabled={balance < price || pending}
          size="sm"
          variant="outline"
        >
          {pending ? "Unlocking..." : <>Unlock &#9889;</>}
        </Button>
      )}
      {hasAccess && (
        <span className="text-sm text-green-600 dark:text-green-400 font-medium">&#10003; Owned</span>
      )}
    </div>
  );
}

export function SparkShop() {
  const { balance } = useSparks();
  const [selectedTier, setSelectedTier] = useState<SparkPurchaseTier | null>(null);

  const lockedCourses = Object.entries(SPARK_CONFIG.coursePrices);

  return (
    <div className="space-y-6">
      {/* Balance header */}
      <div className="text-center py-4">
        <div className="text-sm text-muted-foreground">Your Balance</div>
        <div className="text-4xl font-bold">
          {balance.toLocaleString()} <span className="text-amber-500">&#9889;</span>
        </div>
      </div>

      <Tabs defaultValue="buy">
        <TabsList className="w-full">
          <TabsTrigger value="buy">Buy Sparks</TabsTrigger>
          <TabsTrigger value="courses">Unlock Courses</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="pass">Spark Pass</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PURCHASE_TIERS.map((tier) => (
              <Card key={tier.id} className="cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{tier.label}</CardTitle>
                  <CardDescription>
                    {tier.sparks.toLocaleString()} + {tier.bonusSparks.toLocaleString()} bonus
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                    {(tier.sparks + tier.bonusSparks).toLocaleString()} &#9889;
                  </div>
                  <div className="text-lg font-semibold mb-3">${tier.priceUsd.toFixed(2)}</div>
                  <Button
                    className="w-full"
                    onClick={() => setSelectedTier(tier)}
                  >
                    Buy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <div className="space-y-3">
            {lockedCourses.map(([courseId, price]) => (
              <CourseItem key={courseId} courseId={courseId} price={price} />
            ))}
            {lockedCourses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No paid courses available yet.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span>&#10052;</span> Streak Freeze
                </CardTitle>
                <CardDescription>
                  Protect your streak for one missed day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{SPARK_CONFIG.streakFreezeCost} &#9889;</span>
                  <Button size="sm" disabled={balance < SPARK_CONFIG.streakFreezeCost}>
                    Buy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span>&#127915;</span> Giveaway Entry
                </CardTitle>
                <CardDescription>
                  Enter monthly prize drawings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">100 &#9889;</span>
                  <Button size="sm" disabled={balance < 100}>
                    Enter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pass" className="mt-6">
          <div className="max-w-md mx-auto">
            <SparkPassCard />
          </div>
        </TabsContent>
      </Tabs>

      {selectedTier && (
        <PurchaseModal
          open={!!selectedTier}
          onClose={() => setSelectedTier(null)}
          tier={selectedTier}
        />
      )}
    </div>
  );
}
