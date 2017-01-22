package main

import "net/http"
import "path/filepath"
import "os"
import "log"

func main() {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	
	thisDir, err := filepath.Abs(cwd)
	if err != nil {
		log.Fatal(err)
	}
	
    panic(http.ListenAndServe(":8080", http.FileServer(http.Dir(thisDir))))
}
