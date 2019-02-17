pragma solidity ^0.5.0;

contract Ugovor {

    struct Osoba {
        uint id;
        string ime;
    }

    struct Racun {
        uint id;
        uint osobaId;
        address adresa;
        string nickname;
        uint stanjeRacuna;
    }

    struct Transakcija {
        uint id;
        string dateTime;
        address posiljatelj;
        address primatelj;
        uint iznos;
    }

    mapping(uint => Osoba) public osobe;
    mapping(uint => Racun) public racuni;
    mapping(uint => Transakcija) public transakcije;

    uint public osobeCount;
    uint public racuniCount;
    uint public transakcijeCount;

    event transakcijaEvent (
        uint indexed _posiljatelj,
        uint indexed _primatelj,
        uint indexed _iznos
    );

    constructor() public {
        addOsoba("Alice");
        addRacun(1, "Tekući", 0xb2D93E41E5b4240516D96ccAeB5e05Fd10d5B56f);
        addRacun(1, "Štednja", 0x69BA6e98beeC3da68465FB0F70ad1E44c1aD23ca);
        addRacun(1, "Invest", 0xb13a444B2bD3be2bB3563CAb4a5C37f56e1De416);

        addOsoba("Bob");
        addRacun(2, "Tekući", 0x3f8f1261022715E235de819303782993bA706CeB);
        addRacun(2, "Štednja", 0x54175B636f434A5Af208Ad817CbD110caa36D50a);
    }

    function addOsoba(string memory _ime) private {
        osobeCount++;
        osobe[osobeCount] = Osoba(osobeCount, _ime);
    }

    function addRacun(uint _osobaId, string memory _nickname, address _adresa) private {
        racuniCount++;
        racuni[racuniCount] = Racun(racuniCount, _osobaId, _adresa, _nickname, 100);
    }

    function addTransakcija(string memory _dateTime, uint _posiljatelj, uint _primatelj, uint _iznos) public {
        transakcijeCount++;
        transakcije[transakcijeCount] = Transakcija(transakcijeCount, _dateTime, racuni[_posiljatelj].adresa, racuni[_primatelj].adresa, _iznos);

        if(racuni[_posiljatelj].osobaId != racuni[_primatelj].osobaId)
            updatePosiljatelj(_posiljatelj, 1);

        updatePosiljatelj(_posiljatelj, _iznos);
        updatePrimatelj(_primatelj, _iznos);

        emit transakcijaEvent(_posiljatelj, _primatelj, _iznos);
    }

    function updatePosiljatelj(uint _racunId, uint _iznos) private {
        require(_iznos <= racuni[_racunId].stanjeRacuna);
        racuni[_racunId].stanjeRacuna -= _iznos;
    }

    function updatePrimatelj(uint _racunId, uint _iznos) private {
        racuni[_racunId].stanjeRacuna += _iznos;
    }

    function getOsoba(uint _osobaId) view public returns (string memory) {
        return osobe[_osobaId].ime;
    }

    function getNickname(uint _racunId) view public returns (string memory) {
        return racuni[_racunId].nickname;
    }

    function getStanje(uint _racunId) view public returns (uint) {
        return racuni[_racunId].stanjeRacuna;
    }

}
