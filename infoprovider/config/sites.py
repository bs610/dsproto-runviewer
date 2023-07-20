import json
import os.path

class Site:
    def __init__(self, name, id):
        self.name = name
        self.id = id

class SiteList:
    def __init__(self):
        self.sites = []

        json_file = os.path.normpath(os.path.join(__file__, "..", "..", "src", "sites.json"))
        data = json.load(json_file)

        for obj in data:
            self.sites.append(Site(obj["name"], obj["id"]))

    def get_site_names(self):
        return sorted([s.name for s in self.sites])

    def number_to_name(self, id):
        for s in self.sites:
            if s.id == id:
                return s.name
            
        return None
    
    def name_to_number(self, name):
        for s in self.sites:
            if s.name.lower() == name.lower():
                return s.id
        
        return None