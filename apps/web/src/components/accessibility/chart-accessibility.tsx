import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TableIcon } from "lucide-react";

interface DataPoint {
  date?: string;
  type?: string;
  p90Value?: number;
  weekBeforeValue?: number;
  count?: number;
  [key: string]: any;
}

interface ChartAccessibilityProps {
  data: DataPoint[];
  title: string;
  description: string;
  chartComponent: React.ReactNode;
}

export function ChartAccessibility({
  data,
  title,
  description,
  chartComponent,
}: ChartAccessibilityProps) {
  const [showDataTable, setShowDataTable] = useState(false);

  // Generate a summary for screen readers
  const generateSummary = () => {
    if (!data.length) return "No data available";
    
    const totalPoints = data.length;
    const hasValues = data.some(d => d.p90Value !== undefined || d.count !== undefined);
    
    if (hasValues) {
      const avgValue = data.reduce((sum, d) => sum + (d.p90Value || d.count || 0), 0) / totalPoints;
      return `Chart contains ${totalPoints} data points with an average value of ${avgValue.toFixed(2)}`;
    }
    
    return `Chart contains ${totalPoints} data points`;
  };

  // Get table headers dynamically from data
  const getTableHeaders = () => {
    if (!data.length) return [];
    
    const firstItem = data[0];
    return Object.keys(firstItem).filter(key => 
      key !== 'index' && firstItem[key] !== undefined
    );
  };

  const headers = getTableHeaders();
  const summary = generateSummary();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle id={`chart-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDataTable(!showDataTable)}
              aria-pressed={showDataTable}
              aria-label={`${showDataTable ? 'Hide' : 'Show'} data table for ${title}`}
              data-testid="button-toggle-data-table"
            >
              {showDataTable ? <BarChart3 className="h-4 w-4" /> : <TableIcon className="h-4 w-4" />}
              {showDataTable ? 'Show Chart' : 'Show Data'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {/* Screen reader summary */}
        <div 
          className="sr-only" 
          id={`chart-summary-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {summary}
        </div>
      </CardHeader>
      
      <CardContent>
        {showDataTable ? (
          // Accessible data table
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Table</h3>
            <Table
              aria-label={`Data table for ${title}`}
              aria-describedby={`chart-summary-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header} scope="col">
                      {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell key={header}>
                        {typeof item[header] === 'number' 
                          ? item[header].toLocaleString() 
                          : item[header] || 'N/A'
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          // Chart with accessibility attributes
          <div
            role="img"
            aria-labelledby={`chart-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
            aria-describedby={`chart-summary-${title.replace(/\s+/g, '-').toLowerCase()}`}
            tabIndex={0}
          >
            {chartComponent}
            
            {/* Hidden table for screen readers when chart is shown */}
            <Table className="sr-only" aria-label={`Hidden data table for chart: ${title}`}>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header} scope="col">
                      {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell key={header}>
                        {typeof item[header] === 'number' 
                          ? item[header].toLocaleString() 
                          : item[header] || 'N/A'
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ChartAccessibility;