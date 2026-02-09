import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BulkUploadErrorModal } from "./BulkUploadErrorModal";

interface UploadResult {
  success: boolean;
  row: number;
  data?: any;
  error?: string;
}

export const BulkMachineUpload = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [summary, setSummary] = useState({ total: 0, success: 0, failed: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [selectedErrors, setSelectedErrors] = useState<{ errors: any[]; fileName: string } | null>(null);

  // Fetch upload history from machine_bulk_uploads
  const { data: uploadHistory } = useQuery({
    queryKey: ['machine-bulk-uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('machine_bulk_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const downloadTemplate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-admin-machines-template');
      
      if (error) throw error;
      
      // The response is the CSV text
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'machine_bulk_upload_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (error: any) {
      toast.error(`Failed to download template: ${error.message}`);
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResults([]);
    setSummary({ total: 0, success: 0, failed: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('api-admin-machines-bulk-upload', {
        body: formData,
      });

      if (error) throw error;

      const uploadResults: UploadResult[] = data.errors.map((err: any) => ({
        success: false,
        row: err.row,
        error: err.message
      }));

      // Add success entries
      for (let i = 2; i <= data.totalRows + 1; i++) {
        if (!uploadResults.find(r => r.row === i)) {
          uploadResults.push({
            success: true,
            row: i,
          });
        }
      }

      setResults(uploadResults);
      setSummary({ 
        total: data.totalRows, 
        success: data.successfulRows, 
        failed: data.failedRows 
      });
      
      if (data.successfulRows > 0) {
        queryClient.invalidateQueries({ queryKey: ['machine-inventory'] });
        queryClient.invalidateQueries({ queryKey: ['machine-bulk-uploads'] });
        toast.success(`Successfully uploaded ${data.successfulRows} machines`);
      }
      
      if (data.failedRows > 0) {
        toast.error(`${data.failedRows} rows failed. Check results below.`);
      }
    } catch (error: any) {
      toast.error(`Failed to process file: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const fakeEvent = { target: { files: [file] } } as any;
        handleFileUpload(fakeEvent);
      } else {
        toast.error("Please upload a CSV file");
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Bulk Machine Upload
        </h2>
        <p className="text-muted-foreground mt-1">Upload multiple machines at once via CSV</p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>CSV Format Requirements:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Columns: brand, model, hash_rate_ths, power_watts, location, status, serial_number, quantity</li>
            <li>Valid statuses: AVAILABLE, RESERVED, SOLD, DEPLOYED</li>
            <li>hash_rate_ths and power_watts must be numeric values</li>
            <li>quantity allows bulk creation of identical machines</li>
            <li>Lines starting with # are treated as comments (see template)</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 mb-6">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Drag and Drop Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Drag and drop your CSV file here</p>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <FileText className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Choose File"}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {summary.total > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Rows</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </Card>
            <Card className="p-4 bg-accent/10">
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold text-accent">{summary.success}</p>
            </Card>
            <Card className="p-4 bg-destructive/10">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-destructive">{summary.failed}</p>
            </Card>
          </div>

          {results.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Row</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.row}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <span className="text-sm text-muted-foreground">Successfully uploaded</span>
                        ) : (
                          <span className="text-sm text-destructive">{result.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Upload History */}
      {uploadHistory && uploadHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Upload History</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead className="text-center">Total Rows</TableHead>
                  <TableHead className="text-center">Success</TableHead>
                  <TableHead className="text-center">Failed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadHistory.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="text-sm">
                      {format(new Date(upload.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{upload.file_name}</TableCell>
                    <TableCell className="text-center">{upload.total_rows}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-accent font-semibold">{upload.successful_rows}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-destructive font-semibold">{upload.failed_rows}</span>
                    </TableCell>
                    <TableCell>
                      {upload.status === 'SUCCESS' ? (
                        <Badge variant="default" className="bg-accent/20 text-accent hover:bg-accent/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Success
                        </Badge>
                      ) : upload.status === 'PARTIAL' ? (
                        <Badge variant="default" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Partial
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {upload.failed_rows > 0 && upload.errors_json && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedErrors({
                            errors: upload.errors_json as any[],
                            fileName: upload.file_name
                          })}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Errors
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {selectedErrors && (
        <BulkUploadErrorModal
          open={!!selectedErrors}
          onOpenChange={(open) => !open && setSelectedErrors(null)}
          errors={selectedErrors.errors}
          fileName={selectedErrors.fileName}
        />
      )}
    </Card>
  );
};
