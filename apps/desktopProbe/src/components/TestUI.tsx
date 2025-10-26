import { Button } from '@first2apply/ui';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@first2apply/ui';
import { Badge } from '@first2apply/ui';

export function TestUI() {
  return (
    <div className="space-y-4 p-6">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>UI Library Test</CardTitle>
          <CardDescription>Testing the shared UI components</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is using components from the shared UI library!</p>
          <div className="mt-4 flex gap-2">
            <Badge variant="default">shadcn/ui</Badge>
            <Badge variant="secondary">Shared Library</Badge>
            <Badge variant="outline">Monorepo</Badge>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="default">Primary</Button>
          <Button variant="outline">Secondary</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
