resource "aws_vpc" "vpc" {
  cidr_block = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name = "${var.application}-vpc"
    Environment = var.environment
  }

}
data "aws_availability_zones" "available"{}

resource "aws_subnet" "public_subnet" {
  count = 2
    vpc_id = aws_vpc.vpc.id
   cidr_block = cidrsubnet(aws_vpc.vpc.cidr_block,8,count.index)
   availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.application}-public-subnet-${count.index+1}"
    Environment = var.environment
      "kubernetes.io/role/elb"                  = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_subnet" "private_subnet" {
   count = 2
   vpc_id = aws_vpc.vpc.id
   cidr_block = cidrsubnet(aws_vpc.vpc.cidr_block ,8,count.index+2)
   availability_zone = data.aws_availability_zones.available.names[count.index]
   
   tags = {
    Name = "${var.application}-private-subnet${count.index+1}"
    Environment = var.environment
       "kubernetes.io/role/internal-elb"             = "1"
    "kubernetes.io/cluster/${var.cluster_name}"   = "shared"
   }
}

resource "aws_route_table" "public_route_table" {
    vpc_id = aws_vpc.vpc.id
}

resource "aws_route_table" "private_route_table" {
  vpc_id = aws_vpc.vpc.id
}

resource "aws_route_table_association" "public_route_table_association" {
   count = 2
   route_table_id = aws_route_table.public_route_table.id
   subnet_id = aws_subnet.public_subnet[count.index].id 
}

resource "aws_route_table_association" "private_route_table_association" {
   count = 2
   route_table_id = aws_route_table.private_route_table.id
   subnet_id = aws_subnet.private_subnet[count.index].id
}

resource "aws_internet_gateway" "IGW" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name        = "${var.application}-Internet-gateway"
    Environment = "${var.environment}"
  }
}

resource "aws_route" "public_route" {
  route_table_id = aws_route_table.public_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id = aws_internet_gateway.IGW.id
}

resource "aws_eip" "eip" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat_igw" {
   allocation_id = aws_eip.eip.id 
   subnet_id = aws_subnet.public_subnet[0].id
    tags = {
      Name = "${var.application}-nat-gateway"
      Environment = "${var.environment}"
    }
}

resource "aws_route" "private_route" {
  route_table_id = aws_route_table.private_route_table.id 
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id = aws_nat_gateway.nat_igw.id
}