package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
	"text/template"
)

// TypeScript type mapping
var tsTypeMap = map[string]string{
	"uint":      "number",
	"int":       "number",
	"int64":     "number",
	"float64":   "number",
	"string":    "string",
	"bool":      "boolean",
	"time.Time": "string",
	"*string":   "string | null",
	"*int":      "number | null",
	"*uint":     "number | null",
	"*bool":     "boolean | null",
	"*time.Time": "string | null",
}

// API endpoint structure
type Endpoint struct {
	Method      string
	Path        string
	HandlerName string
	RequestType string
	ResponseType string
}

// Go struct information
type StructInfo struct {
	Name   string
	Fields []FieldInfo
}

type FieldInfo struct {
	Name     string
	Type     string
	JSONTag  string
	Required bool
}

func main() {
	fmt.Println("🔧 Generating TypeScript SDK from Go backend...")

	// Parse the main.go file to extract types and endpoints
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "main.go", nil, parser.ParseComments)
	if err != nil {
		fmt.Printf("Error parsing main.go: %v\n", err)
		os.Exit(1)
	}

	// Extract structs and endpoints
	structs := extractStructs(file)
	endpoints := extractEndpoints(file)

	// Generate TypeScript types
	generateTypes(structs)

	// Generate API client
	generateAPIClient(endpoints)

	// Generate package.json for the SDK
	generatePackageJSON()

	fmt.Println("✅ TypeScript SDK generated successfully!")
}

func extractStructs(file *ast.File) []StructInfo {
	var structs []StructInfo

	for _, decl := range file.Decls {
		if genDecl, ok := decl.(*ast.GenDecl); ok {
			for _, spec := range genDecl.Specs {
				if typeSpec, ok := spec.(*ast.TypeSpec); ok {
					if structType, ok := typeSpec.Type.(*ast.StructType); ok {
						// Include all structs including request/response for API client

						fields := []FieldInfo{}
						for _, field := range structType.Fields.List {
							if len(field.Names) > 0 {
								fieldName := field.Names[0].Name
								fieldType := getTypeString(field.Type)
								
								// Extract JSON tag
								jsonTag := ""
								required := true
								if field.Tag != nil {
									tag := strings.Trim(field.Tag.Value, "`")
									if strings.Contains(tag, "json:") {
										jsonParts := strings.Split(tag, "json:")
										if len(jsonParts) > 1 {
											jsonTag = strings.Trim(strings.Split(jsonParts[1], " ")[0], `"`)
											if strings.Contains(jsonTag, ",omitempty") {
												jsonTag = strings.Replace(jsonTag, ",omitempty", "", 1)
												required = false
											}
										}
									}
								}

								fields = append(fields, FieldInfo{
									Name:     fieldName,
									Type:     fieldType,
									JSONTag:  jsonTag,
									Required: required,
								})
							}
						}

						structs = append(structs, StructInfo{
							Name:   typeSpec.Name.Name,
							Fields: fields,
						})
					}
				}
			}
		}
	}

	return structs
}

func extractEndpoints(file *ast.File) []Endpoint {
	var endpoints []Endpoint

	for _, decl := range file.Decls {
		if funcDecl, ok := decl.(*ast.FuncDecl); ok {
			if funcDecl.Recv == nil && strings.HasPrefix(funcDecl.Name.Name, "handle") {
				// Extract route information from comments or function body
				// For now, we'll use a simple mapping
				handlerName := funcDecl.Name.Name
				method, path := extractRouteInfo(handlerName)
				
				if method != "" && path != "" {
					requestType := getRequestType(handlerName)
					responseType := getResponseType(handlerName)

					endpoints = append(endpoints, Endpoint{
						Method:      method,
						Path:        path,
						HandlerName: handlerName,
						RequestType: requestType,
						ResponseType: responseType,
					})
				}
			}
		}
	}

	return endpoints
}

func extractRouteInfo(handlerName string) (string, string) {
	// Map handler names to routes based on the main.go file
	routeMap := map[string]struct {
		Method string
		Path   string
	}{
		"handleAuthInvite": {"POST", "/api/auth/invite"},
		"handleGetUser":    {"GET", "/api/users"},
		"handleGetProjects": {"GET", "/api/projects"},
		"handleGetProject": {"GET", "/api/projects"},
	}

	if route, exists := routeMap[handlerName]; exists {
		return route.Method, route.Path
	}
	return "", ""
}

func getRequestType(handlerName string) string {
	switch handlerName {
	case "handleAuthInvite":
		return "AuthRequest"
	case "handleGetUser":
		return "void"
	case "handleGetProjects":
		return "void"
	case "handleGetProject":
		return "void"
	default:
		return "any"
	}
}

func getResponseType(handlerName string) string {
	switch handlerName {
	case "handleAuthInvite":
		return "AuthResponse"
	case "handleGetUser":
		return "User"
	case "handleGetProjects":
		return "Project[]"
	case "handleGetProject":
		return "Project"
	default:
		return "any"
	}
}

func getResponseTypeForImport(handlerName string) string {
	switch handlerName {
	case "handleAuthInvite":
		return "AuthResponse"
	case "handleGetUser":
		return "User"
	case "handleGetProjects":
		return "Project"
	case "handleGetProject":
		return "Project"
	default:
		return "any"
	}
}

func getTypeString(expr ast.Expr) string {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.StarExpr:
		return "*" + getTypeString(t.X)
	case *ast.ArrayType:
		return "[]" + getTypeString(t.Elt)
	case *ast.SelectorExpr:
		return getTypeString(t.X) + "." + t.Sel.Name
	default:
		return "any"
	}
}

func mapGoTypeToTS(goType string) string {
	if mapped, exists := tsTypeMap[goType]; exists {
		return mapped
	}
	return goType
}

func generateTypes(structs []StructInfo) {
	tmpl := `// Auto-generated TypeScript types from Go backend
// Do not edit manually - regenerate with: cd backend && go run cmd/generate/main.go

{{range .}}
export interface {{.Name}} {
{{range .Fields}}  {{.JSONTag}}: {{.Type | mapGoTypeToTS}}{{if .Required}};{{else}} | null;{{end}}
{{end}}}

{{end}}
`

	// Create a custom template function
	funcMap := template.FuncMap{
		"mapGoTypeToTS": mapGoTypeToTS,
	}

	t, err := template.New("types").Funcs(funcMap).Parse(tmpl)
	if err != nil {
		fmt.Printf("Error parsing template: %v\n", err)
		return
	}

	// Create the web/src/types directory if it doesn't exist
	webTypesDir := "../web/src/types"
	if err := os.MkdirAll(webTypesDir, 0755); err != nil {
		fmt.Printf("Error creating types directory: %v\n", err)
		return
	}

	file, err := os.Create(filepath.Join(webTypesDir, "api.ts"))
	if err != nil {
		fmt.Printf("Error creating types file: %v\n", err)
		return
	}
	defer file.Close()

	if err := t.Execute(file, structs); err != nil {
		fmt.Printf("Error executing template: %v\n", err)
		return
	}

	fmt.Println("📝 Generated TypeScript types in web/src/types/api.ts")
}

func generateAPIClient(endpoints []Endpoint) {
	tmpl := `// Auto-generated TypeScript API client from Go backend
// Do not edit manually - regenerate with: cd backend && go run cmd/generate/main.go

import type { {{range $i, $struct := .Structs}}{{if $i}}, {{end}}{{$struct}}{{end}} } from '../types/api';

const API_BASE_URL = 'http://localhost:3001';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseURL + endpoint;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'HTTP ' + response.status);
    }

    return response.json();
  }

{{range .Endpoints}}
  async {{.HandlerName | toCamelCase}}({{if eq .Method "POST"}}data: {{.RequestType}}{{end}}): Promise<{{.ResponseType}}> {
    return this.request<{{.ResponseType}}>('{{.Path}}', {
      method: '{{.Method}}',
      {{if eq .Method "POST"}}body: JSON.stringify(data),{{end}}
    });
  }

{{end}}
}

// Export a singleton instance
export const apiClient = new APIClient();

// Export the class for custom instances
export { APIClient };
`

	// Create a custom template function
	funcMap := template.FuncMap{
		"toCamelCase": func(s string) string {
			// Convert handleGetUser to getUser, handleAuthInvite to authInvite, etc.
			if strings.HasPrefix(s, "handle") {
				s = strings.TrimPrefix(s, "handle")
				return strings.ToLower(s[:1]) + s[1:]
			}
			return s
		},
	}

	t, err := template.New("client").Funcs(funcMap).Parse(tmpl)
	if err != nil {
		fmt.Printf("Error parsing template: %v\n", err)
		return
	}

	// Create the web/src/utils directory if it doesn't exist
	webUtilsDir := "../web/src/utils"
	if err := os.MkdirAll(webUtilsDir, 0755); err != nil {
		fmt.Printf("Error creating utils directory: %v\n", err)
		return
	}

	file, err := os.Create(filepath.Join(webUtilsDir, "apiClient.ts"))
	if err != nil {
		fmt.Printf("Error creating API client file: %v\n", err)
		return
	}
	defer file.Close()

	// Get unique structs for imports
	structMap := make(map[string]bool)
	for _, endpoint := range endpoints {
		if endpoint.RequestType != "void" && endpoint.RequestType != "any" {
			structMap[endpoint.RequestType] = true
		}
		if endpoint.ResponseType != "void" && endpoint.ResponseType != "any" {
			// Remove array notation for imports
			responseType := strings.ReplaceAll(endpoint.ResponseType, "[]", "")
			structMap[responseType] = true
		}
	}

	var structs []string
	for s := range structMap {
		structs = append(structs, s)
	}

	data := struct {
		Endpoints []Endpoint
		Structs   []string
	}{
		Endpoints: endpoints,
		Structs:   structs,
	}

	if err := t.Execute(file, data); err != nil {
		fmt.Printf("Error executing template: %v\n", err)
		return
	}

	fmt.Println("🔌 Generated TypeScript API client in web/src/utils/apiClient.ts")
}

func generatePackageJSON() {
	// This is just a placeholder - the actual package.json is managed by the web project
	fmt.Println("📦 Package.json is managed by the web project")
}
