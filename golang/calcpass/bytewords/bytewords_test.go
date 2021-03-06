package bytewords

import (
	"testing"
	"strings"
	"github.com/stretchr/testify/assert"	
)

func Test_Basic(t *testing.T) {
	assert := assert.New(t)

	assert.Equal(256, len(loadWordList()))

	encoder := NewEncoder()

	input := []byte("Hello World!")
	words := encoder.EncodeToString(input)
	assert.Equal("fix hum job\njob jug bug\nhas jug kit\njob hug bun\n", words)

	decoder := NewDecoder()
	res, err := decoder.DecodeString(words)
	assert.Nil(err)
	assert.Equal(input, res)

	//
	// Decoding errors
	//

	//Word number 2 is too short
	_, err = decoder.DecodeString("fog ic joy")
	assert.NotNil(err)
	
	//Word number 2 is too long
	_, err = decoder.DecodeString("fog icee joy")
	assert.NotNil(err)
	
	//"bee" is not a recognized word
	_, err = decoder.DecodeString("fog bee joy")
	assert.NotNil(err)
	
}

//Encode and decode all byte values
func Test_All(t *testing.T) {
	assert := assert.New(t)
	
	input := make([]byte, 256)
	for i := 0; i < 256; i++ {
		input[i] = byte(i)
	}

	encoder := NewEncoder()

	words := encoder.EncodeToString(input)

	const expect = "ace act add age aid aim air ale all and ant any ape arm art ash ask ate axe bad bag ban bar bat bay bed beg bet big bop box boy bug bun bus bit bye cab can cap car cat cog cow cry cup cut dad day den did dig dim dip dog dot dry dug ear eat egg elf end fab fan far fat fax fee few fig fit fix fly fog fox fun fur gag gap gas got gum gut guy had ham has hat hen her hex hid him hip his hit hog how hub hug hum hut ice ink jag jam jar job jog joy jug key kid kit lab lap law lay leg let lid lie lip log low lug mad mag man map max men met mid min mix mom mow mud mug nag nap nay net new now nut oak oar oat odd off oil old out owl own pad pal pan paw pay peg pen pet pig pin pit pop pot pub put rad rag ram ran rap rat raw ray red rex rib rid rim rip row rub rug rum run rut sad sat saw say set she shy sip sir sit ski sky sly sow soy spa spy sum sun tab tag tan tap tar tax tex the til tin tip top toy try tub tug use van vet vex vow wad wag war was wax way web wet who why wig win won wow yak yam yes yet yum zap zen zip zoo "
	assert.Equal(expect, strings.Replace(words, "\n", " ", -1))

	decoder := NewDecoder()
	res, err := decoder.DecodeString(words)
	assert.Nil(err)
	assert.Equal(input, res)

}
