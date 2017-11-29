package main 

import (
	"fmt"
	"bufio"
	"io/ioutil"
	"log"
	"os"
	"os/user"
	"errors"
	"path"
	"path/filepath"
	
	//"github.com/cruxic/calcpass/golang/calcpass/util"
	"github.com/cruxic/calcpass/golang/calcpass"
	
	"golang.org/x/crypto/ssh/terminal"
	"crypto/rand"
	"strings"
	
)

/*

calcpass -create
	0) prompt are you on a secure machine?
	0) prompt name
	1) prompt default password format
	2) prompt KDF
	3) prompt password
	create
	4) prompt location to save seed

calcpass -import [path]
	* prompt path
	*
	* pkexec --user cruxic-calcpass /bin/cat /home/cruxic/hello
	

	

*/

const minEncryptionPasswordLen = 12

func sanitizeSitename(sitename string) string {
	sitename = strings.TrimSpace(sitename)
	sitename = strings.ToLower(sitename)
	return sitename
}

func prompt(readin *bufio.Reader, prompt string, validateFunc func(input string) error) string {
	for {
		fmt.Printf("%s: ", prompt)
		raw, toolong, err := readin.ReadLine()
		if err != nil {
			log.Fatal(err)
		} else if toolong {
			log.Fatal("Line too long")
		}

		input := strings.TrimSpace(string(raw))

		err = validateFunc(input)
		if err != nil {
			fmt.Println(err)
		} else {
			return input
		}
	}
}

func promptPassword(prompt string, validateFunc func(input string) error) string {
	for {
		fmt.Printf("%s: ", prompt)
		raw, err := terminal.ReadPassword(1)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println()

		input := strings.TrimSpace(string(raw))

		err = validateFunc(input)
		if err != nil {
			fmt.Println(err)
		} else {
			return input
		}
	}
}

func getCalcpassDir() (string, error) {
	curUser, err := user.Current()
	if err != nil {
		return "", err
	}
	
	return path.Join(curUser.HomeDir, ".calcpass"), nil
}


func doCreate() {
	readin := bufio.NewReader(os.Stdin)

	calcpassDir, err := getCalcpassDir()
	if err != nil {
		log.Fatal(err)
	}

	var seed calcpass.Seed

	seed.Name = prompt(readin, "Enter a name for this seed (1-12 chars)", func(input string) error {
		//Count runes not bytes
		nRunes := 0
		for _, _ = range input {
			nRunes++
		}

		if nRunes == 0 || nRunes > 12 {
			return errors.New("1-12 characters please")				
		} else {
			return nil
		}
	})

	var encPass string
	for {
		encPass = promptPassword("Enter password to encrypt your seed", func(input string) error {
			if len(input) >= minEncryptionPasswordLen {
				return nil
			} else {
				return errors.New(fmt.Sprintf("Password must be %d characters or more.", minEncryptionPasswordLen))
			}			
		})

		confirm := promptPassword("Type password again to confirm", func(input string) error {
			return nil
		})

		if encPass == confirm {
			break
		} else {
			fmt.Println("Passwords do not match.")
		}
	}

	seed.DefaultPasswordFormat = calcpass.PassFmt_Friendly12
	seed.HighValueKDFType = calcpass.KDFType_QuadBcrypt12

	//Read 128bits secure-random data	
	_, err = rand.Read(seed.Bytes[:])
	if err != nil {
		log.Fatal(err)
	}

	exp, err := calcpass.Format0_Export(&seed, []byte(encPass), calcpass.KDFType_QuadBcrypt14)
	if err != nil {
		log.Fatal(err)
	}


	b64File := path.Join(calcpassDir, seed.Name + ".b64")
	txtFile := path.Join(calcpassDir, seed.Name + ".txt")

	err = ioutil.WriteFile(b64File, []byte(exp.Base64ForQRCode), 0600)
	if err != nil {
		log.Fatal(err)
	}

	err = ioutil.WriteFile(txtFile, []byte(exp.Base64ForQRCode), 0600)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Wrote " + b64File)
	fmt.Println("Wrote " + txtFile)
}

func doCalc() {
	calcpassDir, err := getCalcpassDir()
	if err != nil {
		log.Fatal(err)
	}

	//Find .b64 file
	seedFiles, err := filepath.Glob(path.Join(calcpassDir, "*.b64"))
	if err != nil {
		log.Fatal(err)
	}

	if len(seedFiles) == 0 {
		log.Fatal("No seed files in " + calcpassDir)
	}

	//TODO: in the future allow selection if multiple files
	if len(seedFiles) > 1 {
		log.Fatal("Multiple seed files in " + calcpassDir)
	}

	//Read seed file
	seedFileName := seedFiles[0]
	b64Data, err := ioutil.ReadFile(seedFileName)
	if err != nil {
		log.Fatal(err)
	}

	readin := bufio.NewReader(os.Stdin)

	sitename := prompt(readin, "Enter a website domain name", func(input string) error {
		if len(input) < 2 {
			return errors.New("At least 2 characters please.")
		}

		return nil
	})

	//force lower case
	sitename = strings.ToLower(sitename)

	var seed *calcpass.Seed

	//Prompt and decrypt
	promptPassword("Password to decrypt your seed", func(input string) error {
		if len(input) < minEncryptionPasswordLen {
			return errors.New(fmt.Sprintf("Password must be %d characters or more.", minEncryptionPasswordLen))					
		}

		seed, err = calcpass.ImportFromQRCode(string(b64Data), []byte(input))
		if err != nil {
			return err
		}

		return nil
	})
	


	revision := 0
	p, err := seed.CalculatePassword(sitename, revision)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(p)
	
}


func main() {
	args := os.Args[1:]

	if len(args) == 0 {
		doCalc()
	} else if args[0] == "-create" {
		doCreate()		
	}
	
}
