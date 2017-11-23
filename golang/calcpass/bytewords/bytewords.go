package bytewords

import (
	"errors"
	"fmt"
)

type Encoder struct {
	wordlist []string
	WordsPerLine int
}

type Decoder struct {
	wordmap map[string]byte
}

func NewEncoder() *Encoder {
	return &Encoder{
		wordlist: loadWordList(),
		WordsPerLine: 3,
	}
}

func NewDecoder() *Decoder {
	//Create mapping from string to byte value
	wordlist := loadWordList()
	wordmap := make(map[string]byte)
	for i, word := range wordlist {
		wordmap[word] = byte(i)
	}	

	return &Decoder{
		wordmap: wordmap,
	}	
}

func (enc *Encoder) EncodeToString(data []byte) string {
	nWords := len(data)
	if nWords == 0 {
		return ""
	}
	
	raw := make([]byte, nWords * 4)

	j := 0
	k := 0
	var word string
	for _, b := range data {
		word = enc.wordlist[b]
		
		raw[j] = word[0]
		j++
		raw[j] = word[1]
		j++
		raw[j] = word[2]
		j++

		k++
		if k < enc.WordsPerLine {
			raw[j] = 0x20  //space
		} else {
			raw[j] = 0x0A  //newline
			k = 0
		}
		j++	
	}
	
	return string(raw)
}

/*
Decode a list of words (delimited by white space) into bytes.
*/
func (dec *Decoder) DecodeString(words string) ([]byte, error) {
	result := make([]byte, 0, 8)

	var c, b byte
	var ok bool
	wordBytes := []byte{0,0,0}
	var word string

	curWordLen := 0
	lineNum := 1
		

	//for each character...
	for i := 0; i <= len(words); i++ {
		if i == len(words) {
			//force flush
			c = 0x20
		} else {
			c = words[i]
		}

		//White space?
		if c == 0x20 || c == 0x09 || c == 0x0A || c == 0x0D {
			if curWordLen > 0 {
				if curWordLen < 3 {
					return nil, errors.New(fmt.Sprintf("Word number %d is too short.", len(result)+1))
				}

				word = string(wordBytes)
				b, ok = dec.wordmap[word]
				if !ok {
					return nil, errors.New(fmt.Sprintf("\"%s\" is not a recognized word (word number %d)", word, len(result)+1))
				}

				result = append(result, b)
				curWordLen = 0
			}
		} else if curWordLen >= 3 {
			return nil, errors.New(fmt.Sprintf("Word number %d is too long.", len(result)+1))						
		} else {
			wordBytes[curWordLen] = c
			curWordLen++
		}
		
		if c == 0x0A {
			lineNum++
		}
	}

	return result, nil	
}

